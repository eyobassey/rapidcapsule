import { v4 as uuidv4 } from 'uuid';
import { get, post } from '../axios';
import { SearchQueryDto } from '../../../modules/health-checkup/dto/search-query.dto';

export class Infermedica {
  private baseUrl = 'https://api.infermedica.com/v3/';
  private readonly apiKey: string;
  private readonly appId: string;
  private interviewId: string;
  
  constructor(interviewId?: string) {
    this.apiKey = <string>process.env.INFERMEDICA_API_KEY;
    this.appId = <string>process.env.INFERMEDICA_APP_ID;
    // Generate new interview ID for each instance or use provided one
    this.interviewId = interviewId || uuidv4();
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'App-Id': this.appId,
      'App-Key': this.apiKey,
      'Interview-Id': this.interviewId,
    };
  }

  parseFreeText(data) {
    return post(`${this.baseUrl}parse`, data, { headers: this.getHeaders() });
  }

  getRiskFactors(age: number) {
    return get(`${this.baseUrl}risk_factors?age.value=${age}`, this.getHeaders());
  }

  getSuggestedSymptoms(data) {
    return post(`${this.baseUrl}suggest`, data, {
      headers: this.getHeaders(),
    });
  }

  diagnosis(data) {
    console.log('=== INFERMEDICA DIAGNOSIS REQUEST ===');
    console.log('Request URL:', `${this.baseUrl}diagnosis`);
    console.log('Request headers:', this.getHeaders());
    console.log('Request payload (full):', JSON.stringify(data, null, 2));
    console.log('Evidence items count:', data.evidence?.length || 0);
    
    // Check for duration in evidence
    if (data.evidence) {
      data.evidence.forEach((item, index) => {
        if (item.duration) {
          console.log(`Evidence ${index} duration:`, item.duration, typeof item.duration);
        }
      });
    }
    
    console.log('=== END INFERMEDICA REQUEST LOG ===');
    
    return post(`${this.baseUrl}diagnosis`, data, {
      headers: this.getHeaders(),
    });
  }

  explain(data) {
    return post(`${this.baseUrl}explain`, data, {
      headers: this.getHeaders(),
    });
  }

  triage(data) {
    console.log('=== INFERMEDICA TRIAGE REQUEST ===');
    console.log('Request URL:', `${this.baseUrl}triage`);
    console.log('Request payload:', JSON.stringify(data, null, 2));
    console.log('=== END INFERMEDICA TRIAGE REQUEST ===');

    return post(`${this.baseUrl}triage`, data, {
      headers: this.getHeaders(),
    });
  }

  search(data: SearchQueryDto) {
    const { phrase, sex, max_results, age } = data;
    const params = {
      phrase,
      'age.value': age,
      sex,
      max_results,
      types: 'symptom',
    };
    return get(`${this.baseUrl}search`, this.getHeaders(), params);
  }

  getSettings() {
    return get(`${this.baseUrl}settings`, this.getHeaders());
  }
}
