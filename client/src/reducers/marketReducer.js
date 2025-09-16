export const marketInitialState = {
  listings: [],
  myListings: [],
  filter: 'all',
  activeTab: 'browse',
  loading: false,
  error: '',
  success: '',
  sellDialog: null,
  sellQuantity: '',
  sellPrice: ''
};

export function marketReducer(state, action) {
  switch (action.type) {
    case 'SET_LISTINGS':
      return { ...state, listings: action.payload, loading: false };
    
    case 'SET_MY_LISTINGS':
      return { ...state, myListings: action.payload };
    
    case 'SET_FILTER':
      return { ...state, filter: action.payload };
    
    case 'SET_TAB':
      return { ...state, activeTab: action.payload, error: '', success: '' };
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, success: '', loading: false };
    
    case 'SET_SUCCESS':
      return { ...state, success: action.payload, error: '', loading: false };
    
    case 'OPEN_SELL_DIALOG':
      return { 
        ...state, 
        sellDialog: action.payload,
        sellQuantity: '',
        sellPrice: '',
        error: '',
        success: ''
      };
    
    case 'CLOSE_SELL_DIALOG':
      return { 
        ...state, 
        sellDialog: null,
        sellQuantity: '',
        sellPrice: ''
      };
    
    case 'SET_SELL_QUANTITY':
      return { ...state, sellQuantity: action.payload };
    
    case 'SET_SELL_PRICE':
      return { ...state, sellPrice: action.payload };
    
    case 'RESET_MESSAGES':
      return { ...state, error: '', success: '' };
    
    case 'RESET':
      return marketInitialState;
    
    default:
      return state;
  }
}