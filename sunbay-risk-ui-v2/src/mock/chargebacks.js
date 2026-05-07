export const chargebacks = [
  { id:'CB001', txnId:'txn_abc001', merchantId:'M_1005', merchantName:'JewelBox', isoId:'ISO_2002', cardBrand:'Visa', reasonCode:'10.4', reasonDesc:'Fraud - Card Absent Environment', amount:1250.00, status:'UNDER_REVIEW', outcome:'PENDING', receivedAt:'2026-03-20T10:00:00Z', deadline:'2026-04-19T10:00:00Z' },
  { id:'CB002', txnId:'txn_abc002', merchantId:'M_1002', merchantName:'TechStore', isoId:'ISO_2001', cardBrand:'Mastercard', reasonCode:'4837', reasonDesc:'No Cardholder Authorization', amount:450.00, status:'RECEIVED', outcome:'PENDING', receivedAt:'2026-03-18T14:00:00Z', deadline:'2026-04-17T14:00:00Z' },
  { id:'CB003', txnId:'txn_abc003', merchantId:'M_1011', merchantName:'TravelCo', isoId:'ISO_2001', cardBrand:'Visa', reasonCode:'13.1', reasonDesc:'Merchandise/Services Not Received', amount:3200.00, status:'REPRESENTED', outcome:'PENDING', receivedAt:'2026-03-10T08:00:00Z', deadline:'2026-04-09T08:00:00Z' },
  { id:'CB004', txnId:'txn_abc004', merchantId:'M_1012', merchantName:'GameZone', isoId:'ISO_2002', cardBrand:'Visa', reasonCode:'10.4', reasonDesc:'Fraud - Card Absent Environment', amount:89.99, status:'LOST', outcome:'LOST', receivedAt:'2026-02-20T12:00:00Z', deadline:'2026-03-22T12:00:00Z' },
  { id:'CB005', txnId:'txn_abc005', merchantId:'M_1001', merchantName:'QuickMart', isoId:'ISO_2001', cardBrand:'Mastercard', reasonCode:'4853', reasonDesc:'Cardholder Dispute', amount:67.50, status:'WON', outcome:'WON', receivedAt:'2026-02-10T09:00:00Z', deadline:'2026-03-12T09:00:00Z' },
  { id:'CB006', txnId:'txn_abc006', merchantId:'M_1005', merchantName:'JewelBox', isoId:'ISO_2002', cardBrand:'Visa', reasonCode:'13.3', reasonDesc:'Not as Described', amount:890.00, status:'RECEIVED', outcome:'PENDING', receivedAt:'2026-03-25T11:00:00Z', deadline:'2026-04-24T11:00:00Z' },
  { id:'CB007', txnId:'txn_abc007', merchantId:'M_1010', merchantName:'OnlineShop', isoId:'ISO_2001', cardBrand:'Mastercard', reasonCode:'4837', reasonDesc:'No Cardholder Authorization', amount:234.00, status:'UNDER_REVIEW', outcome:'PENDING', receivedAt:'2026-03-12T15:00:00Z', deadline:'2026-04-11T15:00:00Z' },
  { id:'CB008', txnId:'txn_abc008', merchantId:'M_1012', merchantName:'GameZone', isoId:'ISO_2002', cardBrand:'Visa', reasonCode:'10.4', reasonDesc:'Fraud - Card Absent Environment', amount:149.99, status:'RECEIVED', outcome:'PENDING', receivedAt:'2026-03-28T08:00:00Z', deadline:'2026-04-27T08:00:00Z' },
  { id:'CB009', txnId:'txn_abc009', merchantId:'M_1011', merchantName:'TravelCo', isoId:'ISO_2001', cardBrand:'Amex', reasonCode:'C08', reasonDesc:'Goods/Services Not Received', amount:1800.00, status:'LOST', outcome:'LOST', receivedAt:'2026-02-01T10:00:00Z', deadline:'2026-03-03T10:00:00Z' },
  { id:'CB010', txnId:'txn_abc010', merchantId:'M_1004', merchantName:'FoodHub', isoId:'ISO_2002', cardBrand:'Visa', reasonCode:'13.1', reasonDesc:'Merchandise/Services Not Received', amount:45.00, status:'WON', outcome:'WON', receivedAt:'2026-01-28T12:00:00Z', deadline:'2026-02-27T12:00:00Z' },
  { id:'CB011', txnId:'txn_abc011', merchantId:'M_1005', merchantName:'JewelBox', isoId:'ISO_2002', cardBrand:'Mastercard', reasonCode:'4863', reasonDesc:'Cardholder Does Not Recognize', amount:2100.00, status:'UNDER_REVIEW', outcome:'PENDING', receivedAt:'2026-03-22T09:00:00Z', deadline:'2026-04-21T09:00:00Z' },
  { id:'CB012', txnId:'txn_abc012', merchantId:'M_1013', merchantName:'SubShop', isoId:'ISO_2001', cardBrand:'Visa', reasonCode:'10.4', reasonDesc:'Fraud - Card Absent Environment', amount:28.50, status:'LOST', outcome:'LOST', receivedAt:'2026-01-15T14:00:00Z', deadline:'2026-02-14T14:00:00Z' },
]

export const chargebackTimelines = {
  'CB001': [
    { date:'2026-03-20T10:00:00Z', action:'Received', detail:'Chargeback notification received from Visa', actor:'System' },
    { date:'2026-03-21T09:30:00Z', action:'Assigned', detail:'Assigned to risk analyst for review', actor:'System' },
    { date:'2026-03-22T14:00:00Z', action:'Evidence Requested', detail:'Requested transaction logs and delivery proof from merchant', actor:'John Smith' },
    { date:'2026-03-25T11:00:00Z', action:'Under Review', detail:'Evidence received, analyzing documentation', actor:'John Smith' },
  ],
  'CB003': [
    { date:'2026-03-10T08:00:00Z', action:'Received', detail:'Chargeback notification received from Visa', actor:'System' },
    { date:'2026-03-11T10:00:00Z', action:'Assigned', detail:'Assigned to risk analyst', actor:'System' },
    { date:'2026-03-13T16:00:00Z', action:'Evidence Collected', detail:'Shipping tracking + signed delivery confirmation obtained', actor:'Sarah Lee' },
    { date:'2026-03-15T09:00:00Z', action:'Represented', detail:'Representment submitted with delivery proof and AVS match', actor:'Sarah Lee' },
  ],
  'CB005': [
    { date:'2026-02-10T09:00:00Z', action:'Received', detail:'Chargeback notification received from Mastercard', actor:'System' },
    { date:'2026-02-11T11:00:00Z', action:'Assigned', detail:'Assigned to risk analyst', actor:'System' },
    { date:'2026-02-14T14:00:00Z', action:'Represented', detail:'Submitted 3DS authentication proof + customer purchase history', actor:'Mike Chen' },
    { date:'2026-02-28T10:00:00Z', action:'Won', detail:'Issuer accepted representment, funds returned', actor:'System' },
  ],
}
