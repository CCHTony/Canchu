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
  const res = http.get('https://52.64.240.159/api/1.0/posts/search', {headers: {
    Authorization : 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywibmFtZSI6InRlc3QxMTIzNDUiLCJlbWFpbCI6InRlYWY4ODg3QHRlc3QuY29tIiwicHJvdmlkZXIiOiJuYXRpdmUiLCJwaWN0dXJlIjpudWxsLCJpYXQiOjE2OTE1NjU0NjEsImV4cCI6MTY5MTY1MTg2MX0.2LOa-StHKPzXc7Mb1zXixjGzEpPr9whCpTodEAQsJDA'
  }});
  check(res, { 'status was 200': (r) => r.status == 200 });
  sleep(1);
}