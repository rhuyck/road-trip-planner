import { Day } from '@/types/trip';

const emptyHotel = () => ({ name: '', url: '', cost: '', notes: '' });

export const INITIAL_DAYS: Day[] = [
  { id: 'd00', date: '5/28', dayOfWeek: 'Wednesday', city: 'Minneapolis',  state: 'MN', location: { lat: 44.9778,  lng: -93.2650  }, hotel: emptyHotel(), stops: [] },
  { id: 'd01', date: '5/29', dayOfWeek: 'Friday',    city: 'Kansas City',  state: 'MO', location: { lat: 39.0997,  lng: -94.5786  }, hotel: emptyHotel(), stops: [] },
  { id: 'd02', date: '5/30', dayOfWeek: 'Saturday',  city: 'Englewood',    state: 'CO', location: { lat: 39.6483,  lng: -104.9877 }, hotel: emptyHotel(), stops: [] },
  { id: 'd03', date: '5/31', dayOfWeek: 'Sunday',    city: 'Silverthorne', state: 'CO', location: { lat: 39.6320,  lng: -106.0690 }, hotel: emptyHotel(), stops: [] },
  { id: 'd04', date: '6/1',  dayOfWeek: 'Monday',    city: 'Montrose',     state: 'CO', location: { lat: 38.4783,  lng: -107.8762 }, hotel: emptyHotel(), stops: [] },
  { id: 'd05', date: '6/2',  dayOfWeek: 'Tuesday',   city: 'Torrey',       state: 'UT', location: { lat: 38.1175,  lng: -111.4175 }, hotel: emptyHotel(), stops: [] },
  { id: 'd06', date: '6/3',  dayOfWeek: 'Wednesday', city: 'Brian Head',   state: 'UT', location: { lat: 37.6952,  lng: -112.8500 }, hotel: emptyHotel(), stops: [] },
  { id: 'd07', date: '6/4',  dayOfWeek: 'Thursday',  city: 'Washington',   state: 'UT', location: { lat: 37.1297,  lng: -113.5085 }, hotel: emptyHotel(), stops: [] },
  { id: 'd08', date: '6/5',  dayOfWeek: 'Friday',    city: 'Beatty',       state: 'NV', location: { lat: 36.9086,  lng: -116.7591 }, hotel: emptyHotel(), stops: [] },
  { id: 'd09', date: '6/6',  dayOfWeek: 'Saturday',  city: 'Bishop',       state: 'CA', location: { lat: 37.3635,  lng: -118.3952 }, hotel: emptyHotel(), stops: [] },
  { id: 'd10', date: '6/7',  dayOfWeek: 'Sunday',    city: 'Angels Camp',  state: 'CA', location: { lat: 38.0680,  lng: -120.5399 }, hotel: emptyHotel(), stops: [] },
  { id: 'd11', date: '6/8',  dayOfWeek: 'Monday',    city: 'San Francisco',state: 'CA', location: { lat: 37.7749,  lng: -122.4194 }, hotel: emptyHotel(), stops: [] },
  { id: 'd12', date: '6/9',  dayOfWeek: 'Tuesday',   city: 'Fort Bragg',   state: 'CA', location: { lat: 39.4457,  lng: -123.8053 }, hotel: emptyHotel(), stops: [] },
  { id: 'd13', date: '6/10', dayOfWeek: 'Wednesday', city: 'Crescent City',state: 'CA', location: { lat: 41.7558,  lng: -124.2026 }, hotel: emptyHotel(), stops: [] },
  { id: 'd14', date: '6/11', dayOfWeek: 'Thursday',  city: 'Prineville',   state: 'OR', location: { lat: 44.2998,  lng: -120.8345 }, hotel: emptyHotel(), stops: [] },
  { id: 'd15', date: '6/12', dayOfWeek: 'Friday',    city: 'Mountain Home',state: 'ID', location: { lat: 43.1327,  lng: -115.6916 }, hotel: emptyHotel(), stops: [] },
  { id: 'd16', date: '6/13', dayOfWeek: 'Saturday',  city: 'Bozeman',      state: 'MT', location: { lat: 45.6770,  lng: -111.0429 }, hotel: emptyHotel(), stops: [] },
  { id: 'd17', date: '6/14', dayOfWeek: 'Sunday',    city: 'Halliday',     state: 'ND', location: { lat: 47.3536,  lng: -102.3374 }, hotel: emptyHotel(), stops: [] },
  { id: 'd18', date: '6/15', dayOfWeek: 'Monday',    city: 'Minneapolis',  state: 'MN', location: { lat: 44.9778,  lng: -93.2650  }, hotel: emptyHotel(), stops: [] },
];
