// k6 run script.js

import http from 'k6/http';
import { check, sleep } from 'k6';
export const options = {
  discardResponseBodies: true,
  scenarios: {
    contacts: {
      executor: 'constant-arrival-rate',
      rate: 40,
      timeUnit: '1s',
      duration: '20s',
      preAllocatedVUs: 50,
      maxVUs: 100,
    },
  },
};
// test HTTP
export default function () {
  const res = http.get('https://13.210.26.62/api/1.0/posts/search', {headers: {
    Authorization : 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicHJvdmlkZXIiOiJuYXRpdmUiLCJuYW1lIjoidGVzdCIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInBpY3R1cmUiOiJOVUxMIn0.UWra6dTU2ABK2c2Tqf55fkx_ATMCAj2A8ROioFmJChw'
  }});
  check(res, { 'status was 200': (r) => r.status == 200 });
  sleep(1);
}