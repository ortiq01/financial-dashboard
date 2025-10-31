/**
 * Centralized Transaction Categories Configuration
 * Shared across all bank dashboards
 */

const TRANSACTION_CATEGORIES = {
  'Boodschappen': {
    keywords: [
      'albert heijn', 'ah to go', 'jumbo', 'lidl', 'aldi', 'plus supermarkt',
      'plus berntsen', 'dirk', 'coop', 'spar', 'ekoplaza', 'vomar',
      'deen', 'hoogvliet', 'emte', 'dekamarkt', 'picnic'
    ]
  },
  'Transport': {
    keywords: [
      'shell', 'esso', 'bp', 'bp de hucht', 'total', 'texaco', 
      'parkeren', 'parking', 'park ', 'q park',
      'ns ', 'ov-chipkaart', 'uber', 'bolt', 'taxi',
      'geldmaat', 'benzine', 'diesel', 'tanken'
    ]
  },
  'Utilities': {
    keywords: [
      'ziggo', 'vattenfall', 'eneco', 'nuon', 'essent', 'kpn',
      'vodafone', 't-mobile', 'tele2', 'waterbedrijf', 'waterleiding',
      'energie', 'gas', 'elektra', 'internet', 'telefoon'
    ]
  },
  'Restaurants/Uit eten': {
    keywords: [
      'mcdonald', 'burger king', 'kfc', 'domino', 'pizza',
      'starbucks', 'bagels', 'restaurant', 'cafe', 'bar ',
      'amazing oriental', 'zwarte cross', 'drift beachclub',
      'brasserie de bank', 'luigis', 'uitjedak horeca',
      'ijssalon torino', 'darras coffee', 'bagels beans',
      'goc*zwarte cross', 'gerstali', 'kok experience',
      'brasserie', 'eetcafe', 'grand cafe', 'lunchroom',
      'ijssalon', 'bakkerij', 'banket'
    ]
  },
  'Vrije tijd': {
    keywords: [
      'bioscoop', 'cinema', 'netflix', 'spotify', 'disney', 
      'videoland', 'pathé', 'kinepolis',
      'bol.com', 'amazon', 'coolblue', 'mediamarkt', 'wehkamp',
      'hema', 'action', 'kruidvat', 'etos', 'bloemen', 'blokker',
      'zeeman', 'primark', 'c&a', 'h&m', 'zara', 'bijenkorf'
    ]
  },
  'Verzekeringen': {
    keywords: [
      'verzekering', 'insurance', 'asr ', 'aegon', 
      'nationale nederlanden', 'nn ', 'ditzo', 
      'zilveren kruis', 'zorgverzekering', 'inshared',
      'centraal beheer', 'interpolis', 'allianz', 'reaal',
      'assuradeuren', 'gilde'
    ]
  },
  'Wonen': {
    keywords: [
      'huur', 'rent', 'hypotheek', 'mortgage', 'woningborg',
      'vastgoed', 'makelaardij', 'woonlasten', 'servicekosten',
      'energie', 'bouwmarkt', 'praxis', 'karwei', 'gamma', 'hornbach',
      'ikea', 'kwantum', 'jysk', 'tuincentrum'
    ]
  },
  'Zorg': {
    keywords: [
      'apotheek', 'pharmacy', 'huisarts', 'tandarts', 
      'ziekenhuis', 'hospital', 'fysiotherap', 'medisch',
      'dokter', 'specialist', 'behandeling', 'opticien',
      'pearle', 'vgz', 'menzis', 'cz', 'uzr'
    ]
  },
  'Inkomen': {
    keywords: [
      'salaris', 'loon', 'salary', 'inkomen', 'uitkering',
      'belasting teruggave', 'toeslagen', 'subsidie',
      'belastingdienst', 'toeslagenpartner', 'svb'
    ]
  },
  'Sparen': {
    keywords: [
      'spaar', 'saving', 'belegg', 'investment', 'deposito',
      'aandelen', 'obligatie', 'fonds', 'degiro', 'binck'
    ]
  },
  'Contant': {
    keywords: [
      'geldautomaat', 'atm', 'pinautomaat', 'opname', 
      'withdrawal', 'geldmaat', 'opnemen', 'gea,'
    ]
  }
};

/**
 * Categorize a transaction based on its description
 * @param {string} description - Transaction description
 * @returns {string} Category name
 */
function categorizeTransaction(description) {
  const desc = description.toLowerCase();
  
  // Check each category
  for (const [category, config] of Object.entries(TRANSACTION_CATEGORIES)) {
    for (const keyword of config.keywords) {
      if (desc.includes(keyword)) {
        return category;
      }
    }
  }
  
  // Default category
  return 'Overig';
}

// Export for use in dashboards
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TRANSACTION_CATEGORIES, categorizeTransaction };
}
