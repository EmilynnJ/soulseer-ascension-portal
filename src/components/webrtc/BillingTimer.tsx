import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useWebRTC } from '@/contexts/WebRTCContext';

type BillingTimerProps = {
  sessionId: string;
  ratePerMinute: number; // in cents
  initialBalance: number; // in cents
  onBalanceDepleted: () => void;
};

export const BillingTimer: React.FC<BillingTimerProps> = ({
  sessionId,
  ratePerMinute,
  initialBalance,
  onBalanceDepleted,
}) => {
  const [duration, setDuration] = useState(0); // in seconds
  const [cost, setCost] = useState(0); // in cents
  const [balance, setBalance] = useState(initialBalance); // in cents
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { isCallActive } = useWebRTC();
  
  // Calculate cost per second in cents
  const costPerSecond = ratePerMinute / 60;
  
  // Check if balance is sufficient for another minute
  const hasSufficientBalance = balance >= ratePerMinute;
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Format currency (cents to dollars)
  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };
  
  // Update billing in the database
  const updateBilling = async (durationSec: number, amount: number) => {
    try {
      const { error } = await supabase.from('billing_events').insert([
        {
          session_id: sessionId,
          event_type: 'tick',
          duration_seconds: durationSec,
          amount_billed: amount,
          client_balance_before: balance + amount,
          client_balance_after: balance,
          metadata: {
            rate_per_minute: ratePerMinute,
            cost_per_second: costPerSecond,
          },
        },
      ]);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating billing:', error);
      // We'll continue the session even if billing update fails
      // but we should log this for monitoring
    }
  };
  
  // Update user balance in the database
  const updateUserBalance = async (newBalance: number) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error updating user balance:', error);
      return false;
    }
  };
  
  // Handle billing tick
  useEffect(() => {
    if (!isCallActive || isPaused) return;
    
    const billingInterval = 5; // Bill every 5 seconds
    let elapsed = 0;
    
    const tick = async () => {
      elapsed += 1;
      
      // Update duration
      setDuration(prev => prev + 1);
      
      // Calculate new cost and balance
      const newCost = Math.ceil(duration * costPerSecond);
      const newBalance = initialBalance - newCost;
      
      // Update state
      setCost(newCost);
      setBalance(newBalance);
      
      // Update billing every billingInterval seconds
      if (elapsed % billingInterval === 0) {
        await updateBilling(billingInterval, Math.ceil(billingInterval * costPerSecond));
      }
      
      // Check balance
      if (newBalance < ratePerMinute) {
        onBalanceDepleted();
      }
    };
    
    timerRef.current = setInterval(tick, 1000);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Final billing update when component unmounts
      if (elapsed > 0) {
        updateBilling(elapsed, Math.ceil(elapsed * costPerSecond));
      }
    };
  }, [isCallActive, isPaused]);
  
  // Handle insufficient balance
  useEffect(() => {
    if (balance < ratePerMinute) {
      onBalanceDepleted();
    }
  }, [balance, ratePerMinute, onBalanceDepleted]);
  
  // Pause timer when call is not active
  useEffect(() => {
    if (!isCallActive) {
      setIsPaused(true);
    } else {
      setIsPaused(false);
    }
  }, [isCallActive]);
  
  // Add funds handler
  const handleAddFunds = async () => {
    try {
      // Create a Stripe Checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { amount: 2000 }, // $20.00 in cents
      });
      
      if (error) throw error;
      
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Error adding funds:', error);
      alert('Failed to add funds. Please try again.');
    }
  };
  
  return (
    <div className="fixed top-4 right-4 bg-black/70 text-white p-4 rounded-lg z-50">
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-300">Duration:</span>
          <span className="font-mono">{formatTime(duration)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-300">Rate:</span>
          <span>{formatCurrency(ratePerMinute)}/min</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-300">Cost:</span>
          <span>{formatCurrency(cost)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-300">Balance:</span>
          <span className={balance < ratePerMinute ? 'text-red-400' : 'text-green-400'}>
            {formatCurrency(balance)}
          </span>
        </div>
        
        {balance < ratePerMinute && (
          <div className="mt-2 text-center">
            <p className="text-sm text-red-400 mb-2">Low balance! Add more funds to continue.</p>
            <button
              onClick={handleAddFunds}
              className="bg-pink-600 hover:bg-pink-700 text-white text-sm px-3 py-1 rounded"
            >
              Add $20
            </button>
          </div>
        )}
        
        {isPaused && (
          <div className="mt-2 text-center">
            <p className="text-sm text-yellow-400">Billing paused</p>
          </div>
        )}
      </div>
    </div>
  );
};
