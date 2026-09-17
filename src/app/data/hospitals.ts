export interface Hospital {
  id: number;
  name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  rating: number;
  reviews: number;
  emergency: boolean;
  open24x7: boolean;
  insurance: string[];
  specialties: string[];
  type: string;
  beds: number;
  accreditation: string;
}

export const INSURANCE_PROVIDERS = [
  'Star Health',
  'Niva Bupa',
  'HDFC ERGO',
  'ICICI Lombard',
  'Care Health',
  'Aditya Birla Health',
  'Bajaj Allianz',
  'Tata AIG'
] as const;

type HospitalSeed = readonly [name: string, city: string, state: string];

const CITY_COORDINATES: Record<string, readonly [number, number]> = {
  'New Delhi': [28.6139, 77.2090],
  Mumbai: [19.0760, 72.8777],
  Bengaluru: [12.9716, 77.5946],
  Chennai: [13.0827, 80.2707],
  Hyderabad: [17.3850, 78.4867],
  Kolkata: [22.5726, 88.3639],
  Bhubaneswar: [20.2961, 85.8245],
  Pune: [18.5204, 73.8567],
  Ahmedabad: [23.0225, 72.5714],
  Jaipur: [26.9124, 75.7873],
  Lucknow: [26.8467, 80.9462],
  Kochi: [9.9312, 76.2673],
  Chandigarh: [30.7333, 76.7794],
  Mohali: [30.7046, 76.7179],
  Patna: [25.5941, 85.1376],
  Bhopal: [23.2599, 77.4126],
  Indore: [22.7196, 75.8577],
  Nagpur: [21.1458, 79.0882],
  Guwahati: [26.1445, 91.7362],
  Rishikesh: [30.0869, 78.2676],
  Dehradun: [30.3165, 78.0322],
  Ranchi: [23.3441, 85.3096],
  Raipur: [21.2514, 81.6296],
  Jammu: [32.7266, 74.8570],
  Katra: [32.9915, 74.9318],
  Srinagar: [34.0837, 74.7973],
  Shimla: [31.1048, 77.1734],
  Bilaspur: [31.3380, 76.7565],
  Panaji: [15.4909, 73.8278],
  Visakhapatnam: [17.6868, 83.2185],
  Vijayawada: [16.5062, 80.6480],
  Coimbatore: [11.0168, 76.9558],
  Shillong: [25.5788, 91.8933],
  Imphal: [24.8170, 93.9368],
  Agartala: [23.8315, 91.2868]
};

const HOSPITAL_SEEDS: readonly HospitalSeed[] = [
  ['AIIMS New Delhi', 'New Delhi', 'Delhi'],
  ['Indraprastha Apollo Hospitals', 'New Delhi', 'Delhi'],
  ['Max Super Speciality Hospital, Saket', 'New Delhi', 'Delhi'],
  ['BLK-Max Super Speciality Hospital', 'New Delhi', 'Delhi'],
  ['Sir Ganga Ram Hospital', 'New Delhi', 'Delhi'],
  ['Kokilaben Dhirubhai Ambani Hospital', 'Mumbai', 'Maharashtra'],
  ['Lilavati Hospital and Research Centre', 'Mumbai', 'Maharashtra'],
  ['Nanavati Max Super Speciality Hospital', 'Mumbai', 'Maharashtra'],
  ['P. D. Hinduja Hospital', 'Mumbai', 'Maharashtra'],
  ['Jaslok Hospital and Research Centre', 'Mumbai', 'Maharashtra'],
  ['Manipal Hospital, Old Airport Road', 'Bengaluru', 'Karnataka'],
  ['Fortis Hospital, Bannerghatta Road', 'Bengaluru', 'Karnataka'],
  ['Narayana Institute of Cardiac Sciences', 'Bengaluru', 'Karnataka'],
  ['Aster CMI Hospital', 'Bengaluru', 'Karnataka'],
  ['Sakra World Hospital', 'Bengaluru', 'Karnataka'],
  ['Apollo Hospitals, Greams Road', 'Chennai', 'Tamil Nadu'],
  ['MIOT International', 'Chennai', 'Tamil Nadu'],
  ['Kauvery Hospital, Alwarpet', 'Chennai', 'Tamil Nadu'],
  ['SIMS Hospital, Vadapalani', 'Chennai', 'Tamil Nadu'],
  ['MGM Healthcare', 'Chennai', 'Tamil Nadu'],
  ['Apollo Hospitals, Jubilee Hills', 'Hyderabad', 'Telangana'],
  ['KIMS Hospitals, Secunderabad', 'Hyderabad', 'Telangana'],
  ['Yashoda Hospitals, Somajiguda', 'Hyderabad', 'Telangana'],
  ['CARE Hospitals, Banjara Hills', 'Hyderabad', 'Telangana'],
  ['Continental Hospitals, Gachibowli', 'Hyderabad', 'Telangana'],
  ['Apollo Multispeciality Hospitals', 'Kolkata', 'West Bengal'],
  ['Fortis Hospital, Anandapur', 'Kolkata', 'West Bengal'],
  ['AMRI Hospital, Dhakuria', 'Kolkata', 'West Bengal'],
  ['Medica Superspecialty Hospital', 'Kolkata', 'West Bengal'],
  ['Peerless Hospital', 'Kolkata', 'West Bengal'],
  ['Apollo Hospitals, Bhubaneswar', 'Bhubaneswar', 'Odisha'],
  ['SUM Ultimate Medicare', 'Bhubaneswar', 'Odisha'],
  ['KIMS Hospital, Bhubaneswar', 'Bhubaneswar', 'Odisha'],
  ['AMRI Hospital, Bhubaneswar', 'Bhubaneswar', 'Odisha'],
  ['Ruby Hall Clinic', 'Pune', 'Maharashtra'],
  ['Jehangir Hospital', 'Pune', 'Maharashtra'],
  ['Sahyadri Super Speciality Hospital', 'Pune', 'Maharashtra'],
  ['Jupiter Hospital, Baner', 'Pune', 'Maharashtra'],
  ['Apollo Hospitals International', 'Ahmedabad', 'Gujarat'],
  ['Shalby Multispeciality Hospital', 'Ahmedabad', 'Gujarat'],
  ['Zydus Hospitals', 'Ahmedabad', 'Gujarat'],
  ['Marengo CIMS Hospital', 'Ahmedabad', 'Gujarat'],
  ['Sawai Man Singh Hospital', 'Jaipur', 'Rajasthan'],
  ['Fortis Escorts Hospital, Jaipur', 'Jaipur', 'Rajasthan'],
  ['Narayana Multispeciality Hospital', 'Jaipur', 'Rajasthan'],
  ['Manipal Hospital, Jaipur', 'Jaipur', 'Rajasthan'],
  ['Medanta Hospital, Lucknow', 'Lucknow', 'Uttar Pradesh'],
  ['Apollomedics Super Speciality Hospital', 'Lucknow', 'Uttar Pradesh'],
  ['Sanjay Gandhi Postgraduate Institute', 'Lucknow', 'Uttar Pradesh'],
  ['King George Medical University Hospital', 'Lucknow', 'Uttar Pradesh'],
  ['Amrita Hospital, Kochi', 'Kochi', 'Kerala'],
  ['Aster Medcity', 'Kochi', 'Kerala'],
  ['Rajagiri Hospital', 'Kochi', 'Kerala'],
  ['VPS Lakeshore Hospital', 'Kochi', 'Kerala'],
  ['PGIMER Chandigarh', 'Chandigarh', 'Chandigarh'],
  ['Fortis Hospital, Mohali', 'Mohali', 'Punjab'],
  ['Max Super Speciality Hospital, Mohali', 'Mohali', 'Punjab'],
  ['Ivy Hospital, Mohali', 'Mohali', 'Punjab'],
  ['AIIMS Patna', 'Patna', 'Bihar'],
  ['Paras HMRI Hospital', 'Patna', 'Bihar'],
  ['Medanta Hospital, Patna', 'Patna', 'Bihar'],
  ['Ruban Memorial Hospital', 'Patna', 'Bihar'],
  ['AIIMS Bhopal', 'Bhopal', 'Madhya Pradesh'],
  ['Bansal Hospital', 'Bhopal', 'Madhya Pradesh'],
  ['Chirayu Medical College and Hospital', 'Bhopal', 'Madhya Pradesh'],
  ['Bombay Hospital, Indore', 'Indore', 'Madhya Pradesh'],
  ['CHL Hospital', 'Indore', 'Madhya Pradesh'],
  ['Choithram Hospital and Research Centre', 'Indore', 'Madhya Pradesh'],
  ['AIIMS Nagpur', 'Nagpur', 'Maharashtra'],
  ['Wockhardt Hospitals, Nagpur', 'Nagpur', 'Maharashtra'],
  ['Kingsway Hospitals', 'Nagpur', 'Maharashtra'],
  ['Apollo Excelcare Hospital', 'Guwahati', 'Assam'],
  ['GNRC Hospitals', 'Guwahati', 'Assam'],
  ['NEMCARE Super Speciality Hospital', 'Guwahati', 'Assam'],
  ['AIIMS Rishikesh', 'Rishikesh', 'Uttarakhand'],
  ['Max Super Speciality Hospital, Dehradun', 'Dehradun', 'Uttarakhand'],
  ['Synergy Institute of Medical Sciences', 'Dehradun', 'Uttarakhand'],
  ['Medica Hospital, Ranchi', 'Ranchi', 'Jharkhand'],
  ['Paras HEC Hospital', 'Ranchi', 'Jharkhand'],
  ['Orchid Medical Centre', 'Ranchi', 'Jharkhand'],
  ['AIIMS Raipur', 'Raipur', 'Chhattisgarh'],
  ['Ramkrishna CARE Hospitals', 'Raipur', 'Chhattisgarh'],
  ['Shri Balaji Institute of Medical Science', 'Raipur', 'Chhattisgarh'],
  ['Government Medical College Hospital, Jammu', 'Jammu', 'Jammu and Kashmir'],
  ['Shri Mata Vaishno Devi Narayana Hospital', 'Katra', 'Jammu and Kashmir'],
  ['Sher-i-Kashmir Institute of Medical Sciences', 'Srinagar', 'Jammu and Kashmir'],
  ['Paras Health, Srinagar', 'Srinagar', 'Jammu and Kashmir'],
  ['Indira Gandhi Medical College Hospital', 'Shimla', 'Himachal Pradesh'],
  ['AIIMS Bilaspur', 'Bilaspur', 'Himachal Pradesh'],
  ['Manipal Hospitals, Goa', 'Panaji', 'Goa'],
  ['Healthway Hospital, Goa', 'Panaji', 'Goa'],
  ['Apollo Hospitals, Health City', 'Visakhapatnam', 'Andhra Pradesh'],
  ['Medicover Hospitals, Visakhapatnam', 'Visakhapatnam', 'Andhra Pradesh'],
  ['Manipal Hospital, Vijayawada', 'Vijayawada', 'Andhra Pradesh'],
  ['Ramesh Hospitals, Vijayawada', 'Vijayawada', 'Andhra Pradesh'],
  ['Kovai Medical Center and Hospital', 'Coimbatore', 'Tamil Nadu'],
  ['PSG Hospitals', 'Coimbatore', 'Tamil Nadu'],
  ['NEIGRIHMS', 'Shillong', 'Meghalaya'],
  ['Regional Institute of Medical Sciences', 'Imphal', 'Manipur'],
  ['ILS Hospitals, Agartala', 'Agartala', 'Tripura']
];

const SPECIALTY_GROUPS = [
  ['Cardiology', 'Neurology', 'Emergency Care'],
  ['Oncology', 'Orthopaedics', 'Critical Care'],
  ['Paediatrics', 'Obstetrics', 'General Surgery'],
  ['Nephrology', 'Gastroenterology', 'Internal Medicine'],
  ['Cardiac Surgery', 'Pulmonology', 'Diagnostics']
] as const;

export const HOSPITALS: Hospital[] = HOSPITAL_SEEDS.map((seed, index) => {
  const id = index + 1;
  const [name, city, state] = seed;
  const [baseLatitude, baseLongitude] = CITY_COORDINATES[city] ?? [20.5937, 78.9629];
  const coordinateOffset = ((id % 5) - 2) * 0.012;
  const insuranceCount = 3 + (id % 3);
  const insurance = Array.from({ length: insuranceCount }, (_, insuranceIndex) =>
    INSURANCE_PROVIDERS[(id + insuranceIndex * 2) % INSURANCE_PROVIDERS.length]
  );

  return {
    id,
    name,
    city,
    state,
    latitude: Number((baseLatitude + coordinateOffset).toFixed(4)),
    longitude: Number((baseLongitude - coordinateOffset / 2).toFixed(4)),
    rating: Number((4 + ((id * 7) % 9) / 10).toFixed(1)),
    reviews: 320 + ((id * 137) % 2500),
    emergency: id % 7 !== 0,
    open24x7: id % 5 !== 0,
    insurance: [...insurance],
    specialties: [...SPECIALTY_GROUPS[index % SPECIALTY_GROUPS.length]],
    type: id % 10 === 0 ? 'Teaching & research hospital' : 'Multi-speciality hospital',
    beds: 150 + ((id * 37) % 650),
    accreditation: id % 4 === 0 ? 'NABH & JCI' : 'NABH'
  };
});
