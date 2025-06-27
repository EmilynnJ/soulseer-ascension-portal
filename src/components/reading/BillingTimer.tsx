import { useEffect, useState, useRef } from 'react';
import { formatTime, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

type BillingTimerProps = {
  sessionId: string;
  ratePerMinute: number; // in cents
  initialBalance: number; // in cents
  onBalanceDepleted: () => void;
  isPaused?: boolean;
};

export const BillingTimer: React.FC<BillingTimerProps> = ({
  sessionId,
  ratePerMinute,
  initialBalance,
  onBalanceDepleted,
  isPaused = false,
}) => {
  const [duration, setDuration] = useState(0); // in seconds
  const [cost, setCost] = useState(0); // in cents
  const [balance, setBalance] = useState(initialBalance); // in cents
  const [isActive, setIsActive] = useState(!isPaused);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const billingRef = useRef<NodeJS.Timeout | null>(null);
  
  // Calculate cost per second in cents
  const costPerSecond = ratePerMinute / 60;
  
  // Check if balance is sufficient for another minute
  const hasSufficientBalance = balance >= ratePerMinute;
  
  // Update billing in the database
  const updateBilling = async (durationSec: number, amount: number) => {
    try {
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
        .from('profiles')
        .update({ balance: newBalance })
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error updating user balance:', error);
      return false;
    }
  };
  
  // Handle billing tick
  useEffect(() => {
    if (isPaused) {
      setIsActive(false);
      return;
    } else {
      setIsActive(true);
    }
    
    // Timer for UI updates (every second)
    if (isActive) {
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
        
        // Calculate new cost
        const newCost = Math.ceil((duration + 1) * costPerSecond);
        setCost(newCost);
        
        // Update balance
        const newBalance = initialBalance - newCost;
        setBalance(newBalance);
        
        // Check balance
        if (newBalance < ratePerMinute) {
          toast.warning('Your balance is running low!');
          if (newBalance <= 0) {
            onBalanceDepleted();
          }
        }
      }, 1000);
    }
    
    // Billing timer (every minute)
    if (isActive) {
      const billingInterval = 60; // Bill every 60 seconds
      
      billingRef.current = setInterval(async () => {
        // Process billing
        const amountToCharge = Math.ceil(billingInterval * costPerSecond);
        
        if (balance < amountToCharge) {
          onBalanceDepleted();
          return;
        }
        
        await updateBilling(billingInterval, amountToCharge);
        
        // Update server-side balance
        await updateUserBalance(balance);
      }, billingInterval * 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (billingRef.current) {
        clearInterval(billingRef.current);
      }
    };
  }, [isActive, isPaused, balance, duration]);
  
  // Handle insufficient balance
  useEffect(() => {
    if (balance < ratePerMinute) {
      toast.warning('Your balance is running low. Please add more funds to continue.');
      
      if (balance <= 0) {
        onBalanceDepleted();
      }
    }
  }, [balance, ratePerMinute, onBalanceDepleted]);
  
  // Add funds handler
  const handleAddFunds = async () => {
    try {
      // Create a Stripe Checkout session
        body: { amount: 2000 }, // $20.00 in cents
      });
      
      if (error) throw error;
      
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Error adding funds:', error);
      toast.error('Failed to add funds. Please try again.');
    }
  };
  
  return (
    <div className="bg-black/70 text-white p-4 rounded-lg">
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-300">Duration:</span>
          <span className="font-mono">{formatTime(duration)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-300">Rate:</span>
          <span>{formatCurrency(ratePerMinute / 100)}/min</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-300">Cost:</span>
          <span>{formatCurrency(cost / 100)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-300">Balance:</span>
          <span className={balance < ratePerMinute ? 'text-red-400' : 'text-green-400'}>
            {formatCurrency(balance / 100)}
          </span>
        </div>
        
        {balance < ratePerMinute * 2 && (
          <div className="mt-2 text-center">
            <p className="text-sm text-red-400 mb-2">Low balance! Add more funds to continue.</p>
            <Button
              onClick={handleAddFunds}
              className="bg-pink-600 hover:bg-pink-700 text-white text-sm px-3 py-1 rounded w-full"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" /> Add $20
            </Button>
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