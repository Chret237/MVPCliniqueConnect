import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  Activity, ArrowRight, Bell, CalendarDays, Check, ChevronDown, ChevronRight,
  CircleDollarSign, CircleHelp, Clock3, FileText, HeartPulse, LayoutDashboard,
  LucideAngularModule, Menu, MessageSquareText, MoreHorizontal, Plus, Search,
  Settings, ShieldCheck, Stethoscope, UserRound, UsersRound, Wifi, X,
} from 'lucide-angular';
import { forkJoin } from 'rxjs';
import { ApiService } from './api.service';
import { Appointment, DashboardData, Patient, Section } from './models';

@Component({
  selector: 'cc-root',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule, DatePipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly icons = {
    Activity, ArrowRight, Bell, CalendarDays, Check, ChevronDown, ChevronRight,
    CircleDollarSign, CircleHelp, Clock3, FileText, HeartPulse, LayoutDashboard,
    Menu, MessageSquareText, MoreHorizontal, Plus, Search, Settings, ShieldCheck,
    Stethoscope, UserRound, UsersRound, Wifi, X,
  };

  activeSection: Section = 'dashboard';
  mobileMenuOpen = false;
  showCreatePatient = false;
  showNotifications = false;
  showAllAppointments = false;
  loading = true;
  notice = '';
  searchQuery = '';
  dashboard: DashboardData = { appointmentsToday: 0, arrivals: 0, waiting: 0, pendingTasks: 0 };
  appointments: Appointment[] = [];
  patients: Patient[] = [];

  readonly nav: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'patients', label: 'Patients', icon: UsersRound },
    { id: 'planning', label: 'Planning', icon: CalendarDays },
    { id: 'admissions', label: 'Admissions', icon: Stethoscope },
    { id: 'billing', label: 'Facturation', icon: CircleDollarSign },
    { id: 'support', label: 'Support', icon: MessageSquareText },
  ];

  readonly patientForm = this.fb.nonNullable.group({
    first_name: ['', [Validators.required, Validators.maxLength(100)]],
    last_name: ['', [Validators.required, Validators.maxLength(100)]],
    phone: ['', Validators.maxLength(30)],
    city: ['Yaoundé', Validators.maxLength(80)],
  });

  ngOnInit(): void {
    forkJoin({
      dashboard: this.api.getDashboard(),
      appointments: this.api.getAppointments(),
      patients: this.api.getPatients(),
    }).subscribe(({ dashboard, appointments, patients }) => {
      this.dashboard = dashboard;
      this.appointments = appointments;
      this.patients = patients;
      this.loading = false;
    });
  }

  get sectionTitle(): string {
    return this.nav.find((item) => item.id === this.activeSection)?.label ?? 'Tableau de bord';
  }

  get visibleAppointments(): Appointment[] {
    return this.showAllAppointments ? this.appointments : this.appointments.slice(0, 4);
  }

  get filteredPatients(): Patient[] {
    const query = this.searchQuery.trim().toLocaleLowerCase();
    if (!query) return this.patients;
    return this.patients.filter((patient) =>
      `${patient.first_name} ${patient.last_name} ${patient.reference} ${patient.phone}`.toLocaleLowerCase().includes(query),
    );
  }

  get waitingPatients(): Appointment[] {
    return this.appointments.filter((item) => ['arrived', 'in_consultation'].includes(item.status));
  }

  selectSection(section: Section): void {
    this.activeSection = section;
    this.mobileMenuOpen = false;
  }

  submitPatient(): void {
    if (this.patientForm.invalid) {
      this.patientForm.markAllAsTouched();
      return;
    }
    this.api.createPatient(this.patientForm.getRawValue()).subscribe((patient) => {
      this.patients = [patient, ...this.patients];
      this.showCreatePatient = false;
      this.patientForm.reset({ first_name: '', last_name: '', phone: '', city: 'Yaoundé' });
      this.notice = `${patient.first_name} ${patient.last_name} a été ajouté·e.`;
      window.setTimeout(() => this.notice = '', 3500);
    });
  }

  statusLabel(status: Appointment['status']): string {
    return {
      planned: 'Planifié', confirmed: 'Confirmé', arrived: 'Arrivé',
      in_consultation: 'En consultation', done: 'Terminé',
      cancelled: 'Annulé', no_show: 'Absent',
    }[status];
  }

  initials(first: string, last: string): string {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  }
}
