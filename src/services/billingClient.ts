import { supabase } from '@/lib/supabase';

// Define types
export type BillingEvent = {
  id: string;
  sessionId: string;
  eventType: 'minute' | 'gift' | 'refund';
  amountBilled: number;
  clientBalanceBefore: number;
  clientBalanceAfter: number;
  readerEarnings: number;
  platformFee: number;
  createdAt: string;
};

export type BillingStatus = {
  balance: number;
  rate: number;
  duration: number;
  cost: number;
  isPaused: boolean;
};

class BillingClient {
  private sessionId: string | null = null;
  private rate: number = 0;
  private balance: number = 0;
  private duration: number = 0;
  private cost: number = 0;
  private isPaused: boolean = true;
  private billingInterval: number | null = null;
  private billingFrequency: number = 60; // seconds
  private onBalanceUpdateCallbacks: ((balance: number) => void)[] = [];
  private onBalanceDepletedCallbacks: (() => void)[] = [];
  private onBillingErrorCallbacks: ((error: Error) => void)[] = [];
  
  // Initialize billing for a session
  public initialize(sessionId: string, rate: number, initialBalance: number) {
    this.sessionId = sessionId;
    this.rate = rate;
    this.balance = initialBalance;
    this.duration = 0;
    this.cost = 0;
    this.isPaused = true;
    
    return this;
  }
  
  // Start billing timer
  public start() {
    if (this.billingInterval) {
      clearInterval(this.billingInterval);
    }
    
    this.isPaused = false;
    
    // Bill every minute (or configured frequency)
    this.billingInterval = window.setInterval(async () => {
      try {
        await this.processBilling();
      } catch (error) {
        console.error('Billing error:', error);
        this.onBillingErrorCallbacks.forEach(callback => {
          callback(error instanceof Error ? error : new Error('Unknown billing error'));
        });
      }
    }, this.billingFrequency * 1000);
    
    return this;
  }
  
  // Pause billing
  public pause() {
    this.isPaused = true;
    
    if (this.billingInterval) {
      clearInterval(this.billingInterval);
      this.billingInterval = null;
    }
    
    return this;
  }
  
  // Resume billing
  public resume() {
    if (!this.isPaused) return this;
    
    return this.start();
  }
  
  // Process billing
  private async processBilling() {
    if (!this.sessionId || this.isPaused) return;
    
    try {
      // Calculate amount to bill for this interval
      const amountToCharge = this.calculateAmountToCharge();
      
      // Check if client has sufficient balance
      if (this.balance < amountToCharge) {
        this.onBalanceDepletedCallbacks.forEach(callback => callback());
        return;
      }
      
      // Process billing on server
      const response = await fetch(`/api/webrtc/sessions/${this.sessionId}/bill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountToCharge
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Billing failed');
      }
      
      const data = await response.json();
      
      // Update local state
      this.balance = data.newBalance;
      this.cost += amountToCharge;
      this.duration += this.billingFrequency;
      
      // Notify listeners
      this.onBalanceUpdateCallbacks.forEach(callback => callback(this.balance));
      
    } catch (error) {
      console.error('Error processing billing:', error);
      throw error;
    }
  }
  
  // Calculate amount to charge based on rate and billing frequency
  private calculateAmountToCharge(): number {
    // Convert per-minute rate to per-second rate
    const perSecondRate = this.rate / 60;
    
    // Calculate charge for the billing interval
    return Math.ceil(perSecondRate * this.billingFrequency);
  }
  
  // Add funds to balance
  public async addFunds(amount: number): Promise<boolean> {
    try {
      // Create payment intent
      const response = await fetch('/api/payments/add-funds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }
      
      const { clientSecret } = await response.json();
      
      // Initialize Stripe
      const stripe = (window as any).Stripe(process.env.VITE_STRIPE_PUBLIC_KEY);
      
      // Confirm payment
      const result = await stripe.confirmCardPayment(clientSecret);
      
      if (result.error) {
        throw new Error(result.error.message || 'Payment failed');
      }
      
      // Payment succeeded, update balance
      this.balance += amount;
      this.onBalanceUpdateCallbacks.forEach(callback => callback(this.balance));
      
      return true;
    } catch (error) {
      console.error('Error adding funds:', error);
      return false;
    }
  }
  
  // Get current billing status
  public getStatus(): BillingStatus {
    return {
      balance: this.balance,
      rate: this.rate,
      duration: this.duration,
      cost: this.cost,
      isPaused: this.isPaused
    };
  }
  
  // Clean up resources
  public cleanup() {
    if (this.billingInterval) {
      clearInterval(this.billingInterval);
      this.billingInterval = null;
    }
    
    this.sessionId = null;
    this.isPaused = true;
  }
  
  // Event registration methods
  public onBalanceUpdate(callback: (balance: number) => void) {
    this.onBalanceUpdateCallbacks.push(callback);
  }
  
  public onBalanceDepleted(callback: () => void) {
    this.onBalanceDepletedCallbacks.push(callback);
  }
  
  public onBillingError(callback: (error: Error) => void) {
    this.onBillingErrorCallbacks.push(callback);
  }
}

// Create singleton instance
export const billingClient = new BillingClient();

export default billingClient;