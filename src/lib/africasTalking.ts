import axios from 'axios'

// Africa's Talking SDK wrapper for M-Pesa integration
class AfricasTalking {
  private apiKey: string
  private username: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.AT_API_KEY || ''
    this.username = process.env.AT_USERNAME || ''
    this.baseUrl = 'https://api.sandbox.africastalking.com' // Use sandbox for testing
    
    // For production, use: https://api.africastalking.com
    if (process.env.NODE_ENV === 'production') {
      this.baseUrl = 'https://api.africastalking.com'
    }
  }

  // Initialize payment (STK push)
  async initiateStkPush(phoneNumber: string, amount: number, metadata: Record<string, any> = {}): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/mobile/payment/request`,
        {
          username: this.username,
          productName: 'WiFiHub Payment',
          phoneNumber,
          currencyCode: 'KES', // Kenya Shillings - adjust per country
          amount,
          metadata: JSON.stringify(metadata)
        },
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            'apiKey': this.apiKey
          }
        }
      )
      
      return response.data
    } catch (error: any) {
      console.error('Africa\'s Talking STK push error:', error.response?.data || error.message)
      throw new Error(`Failed to initiate M-Pesa payment: ${error.response?.data?.errorMessage || error.message}`)
    }
  }

  // Validate M-Pesa transaction (called from webhook)
  async validateTransaction(transactionId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/mobile/payment/query`,
        {
          params: {
            username: this.username,
            transactionId
          },
          headers: {
            'Accept': 'application/json',
            'apiKey': this.apiKey
          }
        }
      )
      
      return response.data
    } catch (error: any) {
      console.error('Africa\'s Talking transaction validation error:', error.response?.data || error.message)
      throw new Error(`Failed to validate M-Pesa transaction: ${error.response?.data?.errorMessage || error.message}`)
    }
  }

  // Send SMS (for notifications, optional)
  async sendSMS(to: string, message: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/messaging`,
        {
          username: this.username,
          to,
          message
        },
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            'apiKey': this.apiKey
          }
        }
      )
      
      return response.data
    } catch (error: any) {
      console.error('Africa\'s Talking SMS error:', error.response?.data || error.message)
      throw new Error(`Failed to send SMS: ${error.response?.data?.errorMessage || error.message}`)
    }
  }
}

// Export singleton instance
export const africasTalking = new AfricasTalking()