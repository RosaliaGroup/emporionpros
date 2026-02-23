// Iron 65 Property Knowledge Base
// This data is used by Aria to answer prospect questions
const IRON65_DATA = {
  building: {
    name: "Iron Sixty-Five",
    nameShort: "Iron 65",
    location: "Newark, NJ",
    type: "Luxury Apartments"
  },
  
  units: {
    studio: {
      type: "Studio",
      rent: "Starting at $2,388/month",
      size: "Varies by unit"
    },
    oneBed: {
      type: "1 Bedroom",
      rent: "Starting at $2,700/month",
      size: "Varies by unit"
    },
    oneBedFlex: {
      type: "1 Bed Flex (Convertible to 2 Bed)",
      rent: "Starting at $3,200/month",
      size: "Varies by unit",
      note: "Can be converted into a 2 bedroom"
    }
  },
  
  fees: {
    application: "$50",
    securityDeposit: "Starting at $1,000, up to 1.5 months rent",
    parking: "No parking available",
    bikeStorage: "$25/month",
    petFee: "$75/month",
    petDeposit: "$500 one-time",
    trashFee: "$10/month",
    waterSewer: "Billed through RUBS (Ratio Utility Billing System)"
  },
  
  optional: {
    internet: "$69.99/month",
    storage: "$75/month for storage units"
  },
  
  amenities: [
    "Fitness gym",
    "Sauna",
    "Rooftop terrace",
    "Concierge service",
    "In-unit washer/dryer"
  ],
  
  leaseTerms: {
    twelveMonth: {
      duration: "12 months",
      incentive: "1 month free rent + 1 year free amenities ($100/month = $1,200 yearly credit)"
    },
    eighteenMonth: {
      duration: "18 months",
      incentive: "Up to $4,000 credit + 1 year free amenities"
    },
    twentyFourMonth: {
      duration: "24 months",
      incentive: "2 months free rent + 12 months free amenities"
    },
    urgencyBonus: "Sign within 24 hours of touring to receive an additional 12 months of free building WiFi"
  },
  
  qualifyingQuestions: [
    {
      question: "What's your monthly budget for rent?",
      field: "budget",
      purpose: "Determine which units to show"
    },
    {
      question: "When are you looking to move in?",
      field: "moveDate",
      purpose: "Check availability"
    },
    {
      question: "What's your approximate annual household income?",
      field: "annualIncome",
      purpose: "Income qualification (typically 3x rent)"
    },
    {
      question: "How would you describe your credit? Excellent, Good, Fair, or Building?",
      field: "creditScore",
      purpose: "Credit qualification"
    },
    {
      question: "What's the best email to send you the appointment invitation? Please spell it out for me.",
      field: "email",
      purpose: "Collect email for tour confirmation"
    }
  ],
  
  calendlyLink: "https://calendly.com/ana-rosaliagroup/65-iron-tour",
  
  conversationFlow: {
    greeting: "Hi {name}, this is Aria from Iron Sixty-Five in Newark. I saw you were interested in our luxury apartments. Do you have 2 minutes to chat about what you're looking for?",
    
    afterYes: "Great! I'd love to learn a bit about what you're looking for so I can show you the perfect unit. {Ask qualifying questions}",
    
    afterNo: "No problem! I'll send you a text with all our pricing and amenities, plus a link to book a tour when you're ready. Sound good?",
    
    bookingPrompt: "Based on what you've shared, I think you'd love our {unitType}. Can I get you scheduled for a tour? I have availability {mention urgency bonus if applicable}.",
    
    closing: "Perfect! I've booked your tour for {time}. You'll get a confirmation text and email with the address and what to bring. Looking forward to showing you your new home!"
  }
};
module.exports = IRON65_DATA;      incentive: "2 months free rent + 12 months free amenities"
    },
    urgencyBonus: "Sign within 24 hours of touring to receive an additional 12 months of free building WiFi"
  },
  
  qualifyingQuestions: [
    {
      question: "What's your monthly budget for rent?",
      field: "budget",
      purpose: "Determine which units to show"
    },
    {
      question: "When are you looking to move in?",
      field: "moveDate",
      purpose: "Check availability"
    },
    {
      question: "What's your approximate annual household income?",
      field: "annualIncome",
      purpose: "Income qualification (typically 3x rent)"
    },
    {
      question: "How would you describe your credit? Excellent, Good, Fair, or Building?",
      field: "creditScore",
      purpose: "Credit qualification"
    }
  ],
  
  calendlyLink: "https://calendly.com/ana-rosaliagroup/65-iron-tour",
  
  conversationFlow: {
    greeting: "Hi {name}, this is Aria from Iron 65 in Newark. I saw you were interested in our luxury apartments. Do you have 2 minutes to chat about what you're looking for?",
    
    afterYes: "Great! I'd love to learn a bit about what you're looking for so I can show you the perfect unit. {Ask qualifying questions}",
    
    afterNo: "No problem! I'll send you a text with all our pricing and amenities, plus a link to book a tour when you're ready. Sound good?",
    
    bookingPrompt: "Based on what you've shared, I think you'd love our {unitType}. Can I get you scheduled for a tour? I have availability {mention urgency bonus if applicable}.",
    
    closing: "Perfect! I've booked your tour for {time}. You'll get a confirmation text with the address and what to bring. Looking forward to showing you your new home!"
  }
};

module.exports = IRON65_DATA;
