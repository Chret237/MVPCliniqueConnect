import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, timeout } from 'rxjs';
import { Appointment, DashboardData, Paginated, Patient } from './models';

const DEMO_PATIENTS: Patient[] = [
  { id: 'p-1', reference: 'PAT-240128', first_name: 'Mireille', last_name: 'Ngono', phone: '+237 6 75 28 10 44', city: 'Yaoundé', status: 'active' },
  { id: 'p-2', reference: 'PAT-240191', first_name: 'Armand', last_name: 'Tchoumi', phone: '+237 6 99 40 22 16', city: 'Mfoundi', status: 'active' },
  { id: 'p-3', reference: 'PAT-240207', first_name: 'Grâce', last_name: 'Nana', phone: '+237 6 54 17 88 02', city: 'Yaoundé', status: 'active' },
  { id: 'p-4', reference: 'PAT-240219', first_name: 'Paul', last_name: 'Etoa', phone: '+237 6 70 61 29 31', city: 'Biyem-Assi', status: 'active' },
];

const today = new Date();
const at = (hours: number, minutes: number) => {
  const value = new Date(today);
  value.setHours(hours, minutes, 0, 0);
  return value.toISOString();
};

const DEMO_APPOINTMENTS: Appointment[] = [
  { id: 'a-1', patient: { ...DEMO_PATIENTS[0] }, professional: { id: 'd-1', first_name: 'Alice', last_name: 'Njoya', specialty: 'Médecine générale' }, start_at: at(8, 30), reason: 'Consultation générale', status: 'arrived', queue_number: 4 },
  { id: 'a-2', patient: { ...DEMO_PATIENTS[1] }, professional: { id: 'd-2', first_name: 'Samuel', last_name: 'Mballa', specialty: 'Médecine générale' }, start_at: at(9, 15), reason: 'Contrôle', status: 'in_consultation', queue_number: 3 },
  { id: 'a-3', patient: { ...DEMO_PATIENTS[2] }, professional: { id: 'd-1', first_name: 'Alice', last_name: 'Njoya', specialty: 'Médecine générale' }, start_at: at(10, 0), reason: 'Première consultation', status: 'confirmed' },
  { id: 'a-4', patient: { ...DEMO_PATIENTS[3] }, professional: { id: 'd-2', first_name: 'Samuel', last_name: 'Mballa', specialty: 'Médecine générale' }, start_at: at(11, 30), reason: 'Suivi', status: 'planned' },
];

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl =
    document.querySelector<HTMLMetaElement>('meta[name="api-base-url"]')?.content || '/api/v1';

  readonly usingDemo = { value: false };

  getDashboard(): Observable<DashboardData> {
    return this.http.get<Record<string, number>>(`${this.baseUrl}/dashboard`, { withCredentials: true }).pipe(
      timeout(2200),
      map((data) => ({
        appointmentsToday: data['appointments_today'] ?? data['appointments'] ?? 0,
        arrivals: data['arrivals'] ?? 0,
        waiting: data['waiting'] ?? 0,
        pendingTasks: data['pending_tasks'] ?? 0,
      })),
      catchError(() => {
        this.usingDemo.value = true;
        return of({ appointmentsToday: 18, arrivals: 12, waiting: 5, pendingTasks: 3 });
      }),
    );
  }

  getAppointments(queue = false): Observable<Appointment[]> {
    const endpoint = queue ? '/appointments/queue' : '/appointments';
    return this.http.get<Paginated<Appointment> | Appointment[]>(`${this.baseUrl}${endpoint}`, { withCredentials: true }).pipe(
      timeout(2200),
      map((response) => Array.isArray(response) ? response : response.results),
      catchError(() => {
        this.usingDemo.value = true;
        return of(queue ? DEMO_APPOINTMENTS.filter((item) => ['arrived', 'in_consultation'].includes(item.status)) : DEMO_APPOINTMENTS);
      }),
    );
  }

  getPatients(search = ''): Observable<Patient[]> {
    const params = new HttpParams().set('search', search).set('page_size', 20);
    return this.http.get<Paginated<Patient>>(`${this.baseUrl}/patients`, { params, withCredentials: true }).pipe(
      timeout(2200),
      map((response) => response.results),
      catchError((error: HttpErrorResponse) => {
        this.usingDemo.value = true;
        const query = search.toLocaleLowerCase();
        return of(DEMO_PATIENTS.filter((patient) =>
          `${patient.first_name} ${patient.last_name} ${patient.reference} ${patient.phone}`.toLocaleLowerCase().includes(query),
        ));
      }),
    );
  }

  createPatient(patient: Pick<Patient, 'first_name' | 'last_name' | 'phone' | 'city'>): Observable<Patient> {
    return this.http.post<Patient>(`${this.baseUrl}/patients`, patient, { withCredentials: true }).pipe(
      timeout(3000),
      catchError(() => {
        this.usingDemo.value = true;
        return of({
          ...patient,
          id: crypto.randomUUID(),
          reference: `PAT-${Math.floor(240000 + Math.random() * 999)}`,
          status: 'active' as const,
        });
      }),
    );
  }
}
