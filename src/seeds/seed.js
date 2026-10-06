import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Doctor } from '../models/Doctor.js';
import { Clinic } from '../models/Clinic.js';
import { Hospital } from '../models/Hospital.js';
import { Pharmacy } from '../models/Pharmacy.js';
import { Laboratory } from '../models/Laboratory.js';
import { Review } from '../models/Review.js';
import { Appointment } from '../models/Appointment.js';
import { recalculateRating } from '../services/ratingService.js';
import {
  ROLES,
  DOCTOR_APPROVAL_STATUS,
  APPOINTMENT_STATUS,
  TARGET_TYPES
} from '../config/constants.js';

const isDestroyMode = process.argv.includes('--destroy');

async function seedData() {
  console.log('----------------------------------------------------');
  console.log('  D.I. Khan Health Finder — Database Seed Utility');
  console.log('----------------------------------------------------');

  try {
    await connectDB();

    console.log('[Seed] Purging existing database records...');
    await Promise.all([
      User.deleteMany({}),
      Doctor.deleteMany({}),
      Clinic.deleteMany({}),
      Hospital.deleteMany({}),
      Pharmacy.deleteMany({}),
      Laboratory.deleteMany({}),
      Review.deleteMany({}),
      Appointment.deleteMany({})
    ]);

    if (isDestroyMode) {
      console.log('[Seed] Database successfully wiped (--destroy flag provided).');
      await disconnectDB();
      process.exit(0);
    }

    console.log('[Seed] 1. Creating Admin User from environment configuration...');
    const adminUser = await User.create({
      name: env.SEED_ADMIN_NAME,
      email: env.SEED_ADMIN_EMAIL,
      phone: '03001234567',
      password: env.SEED_ADMIN_PASSWORD,
      role: ROLES.ADMIN,
      isActive: true
    });
    console.log(`       Admin created: ${adminUser.email}`);

    console.log('[Seed] 2. Creating Demo Patients...');
    const patient1 = await User.create({
      name: 'Tariq Mehmood',
      email: 'tariq.mehmood@example.com',
      phone: '03011234567',
      password: 'Password123!',
      role: ROLES.PATIENT,
      isActive: true
    });

    const patient2 = await User.create({
      name: 'Ayesha Bibi',
      email: 'ayesha.bibi@example.com',
      phone: '03339876543',
      password: 'Password123!',
      role: ROLES.PATIENT,
      isActive: true
    });

    const patient3 = await User.create({
      name: 'Muhammad Usman',
      email: 'usman.m@example.com',
      phone: '03124567890',
      password: 'Password123!',
      role: ROLES.PATIENT,
      isActive: true
    });

    console.log('[Seed] 3. Creating Demo Doctors in D.I. Khan...');
    // Doctor 1
    const docUser1 = await User.create({
      name: 'Dr. Farhan Khan',
      email: 'dr.farhan@dikhanhealth.pk',
      phone: '03451112233',
      password: 'Password123!',
      role: ROLES.DOCTOR,
      isActive: true
    });

    const doctor1 = await Doctor.create({
      userId: docUser1._id,
      name: 'Dr. Farhan Khan',
      slug: 'dr-farhan-khan',
      specialty: 'Cardiology',
      qualifications: ['MBBS', 'FCPS (Cardiology)', 'Fellowship in Interventional Cardiology'],
      experienceYears: 14,
      gender: 'male',
      bio: 'Senior Consultant Cardiologist treating hypertension, coronary heart disease, and heart rhythm disorders.',
      languages: ['Urdu', 'English', 'Pashto', 'Saraiki'],
      consultationFee: 1500,
      phone: '03451112233',
      whatsapp: '03451112233',
      email: 'dr.farhan@dikhanhealth.pk',
      clinicName: 'Al-Shifa Cardiology Center',
      address: 'Near Old Bus Stand, Faridabad Road',
      area: 'Faridabad',
      city: 'Dera Ismail Khan',
      coordinates: { lat: 31.8322, lng: 70.9025 },
      slotDurationMinutes: 20,
      approvalStatus: DOCTOR_APPROVAL_STATUS.APPROVED,
      isVerified: true,
      isActive: true,
      availability: [
        { day: 'monday', startTime: '16:00', endTime: '21:00', isAvailable: true },
        { day: 'tuesday', startTime: '16:00', endTime: '21:00', isAvailable: true },
        { day: 'wednesday', startTime: '16:00', endTime: '21:00', isAvailable: true },
        { day: 'thursday', startTime: '16:00', endTime: '21:00', isAvailable: true },
        { day: 'friday', startTime: '16:00', endTime: '20:00', isAvailable: true }
      ]
    });

    // Doctor 2
    const docUser2 = await User.create({
      name: 'Dr. Zobia Tariq',
      email: 'dr.zobia@dikhanhealth.pk',
      phone: '03009988776',
      password: 'Password123!',
      role: ROLES.DOCTOR,
      isActive: true
    });

    const doctor2 = await Doctor.create({
      userId: docUser2._id,
      name: 'Dr. Zobia Tariq',
      slug: 'dr-zobia-tariq',
      specialty: 'Gynecology',
      qualifications: ['MBBS', 'FCPS (Obstetrics & Gynecology)'],
      experienceYears: 10,
      gender: 'female',
      bio: 'Specialist Gynecologist & Obstetrician with expertise in maternal-fetal care and minimally invasive procedures.',
      languages: ['Urdu', 'English', 'Saraiki'],
      consultationFee: 1200,
      phone: '03009988776',
      whatsapp: '03009988776',
      email: 'dr.zobia@dikhanhealth.pk',
      clinicName: 'Fatima Memorial Mother & Child Clinic',
      address: 'Mission Road, Opp. Christian Hospital',
      area: 'Mission Road',
      city: 'Dera Ismail Khan',
      coordinates: { lat: 31.8285, lng: 70.9082 },
      slotDurationMinutes: 15,
      approvalStatus: DOCTOR_APPROVAL_STATUS.APPROVED,
      isVerified: true,
      isActive: true,
      availability: [
        { day: 'monday', startTime: '10:00', endTime: '15:00', isAvailable: true },
        { day: 'wednesday', startTime: '10:00', endTime: '15:00', isAvailable: true },
        { day: 'friday', startTime: '10:00', endTime: '13:00', isAvailable: true },
        { day: 'saturday', startTime: '10:00', endTime: '15:00', isAvailable: true }
      ]
    });

    // Doctor 3
    const docUser3 = await User.create({
      name: 'Dr. Imran Qureshi',
      email: 'dr.imran@dikhanhealth.pk',
      phone: '03215544332',
      password: 'Password123!',
      role: ROLES.DOCTOR,
      isActive: true
    });

    const doctor3 = await Doctor.create({
      userId: docUser3._id,
      name: 'Dr. Imran Qureshi',
      slug: 'dr-imran-qureshi',
      specialty: 'Pediatrics',
      qualifications: ['MBBS', 'DCH', 'MCPS (Pediatrics)'],
      experienceYears: 8,
      gender: 'male',
      bio: 'Compassionate Child Specialist focusing on neonatal care, childhood infections, and growth monitoring.',
      languages: ['Urdu', 'English', 'Saraiki'],
      consultationFee: 1000,
      phone: '03215544332',
      whatsapp: '03215544332',
      email: 'dr.imran@dikhanhealth.pk',
      clinicName: 'Child Care Clinic',
      address: 'Circular Road, Near Topanwala Chowk',
      area: 'Circular Road',
      city: 'Dera Ismail Khan',
      coordinates: { lat: 31.834, lng: 70.906 },
      slotDurationMinutes: 15,
      approvalStatus: DOCTOR_APPROVAL_STATUS.APPROVED,
      isVerified: true,
      isActive: true,
      availability: [
        { day: 'monday', startTime: '17:00', endTime: '22:00', isAvailable: true },
        { day: 'tuesday', startTime: '17:00', endTime: '22:00', isAvailable: true },
        { day: 'wednesday', startTime: '17:00', endTime: '22:00', isAvailable: true },
        { day: 'thursday', startTime: '17:00', endTime: '22:00', isAvailable: true },
        { day: 'friday', startTime: '17:00', endTime: '22:00', isAvailable: true },
        { day: 'saturday', startTime: '17:00', endTime: '22:00', isAvailable: true }
      ]
    });

    // Doctor 4 (Pending approval)
    const docUser4 = await User.create({
      name: 'Dr. Nasir Abbas',
      email: 'dr.nasir@dikhanhealth.pk',
      phone: '03347766554',
      password: 'Password123!',
      role: ROLES.DOCTOR,
      isActive: true
    });

    await Doctor.create({
      userId: docUser4._id,
      name: 'Dr. Nasir Abbas',
      slug: 'dr-nasir-abbas',
      specialty: 'Orthopedics',
      qualifications: ['MBBS', 'MS (Orthopedic Surgery)'],
      experienceYears: 6,
      gender: 'male',
      bio: 'Orthopedic surgeon managing bone fractures, joint replacements, and sports injuries.',
      languages: ['Urdu', 'English'],
      consultationFee: 1200,
      phone: '03347766554',
      area: 'Bannu Road',
      city: 'Dera Ismail Khan',
      approvalStatus: DOCTOR_APPROVAL_STATUS.PENDING,
      isVerified: false,
      isActive: true
    });

    console.log('[Seed] 4. Creating Hospitals in D.I. Khan...');
    const hospital1 = await Hospital.create({
      name: 'District Headquarter (DHQ) Teaching Hospital',
      slug: 'dhq-teaching-hospital-dikhan',
      description: 'Major tertiary care government hospital in Dera Ismail Khan providing complete 24/7 inpatient, outpatient, and critical care trauma services.',
      phone: '0966-9280111',
      emergencyPhone: '0966-9280112',
      email: 'dhq@dikhanhealth.pk',
      address: 'Commissionery Bazar, Civil Lines',
      area: 'Civil Lines',
      city: 'Dera Ismail Khan',
      coordinates: { lat: 31.826, lng: 70.912 },
      departments: ['Emergency Trauma', 'Cardiology', 'General Surgery', 'Pediatrics', 'ICU', 'Gynecology'],
      bedCount: 350,
      is24Hours: true,
      isEmergency: true,
      ambulanceAvailable: true,
      services: ['24/7 Trauma Unit', 'ICU / CCU', 'Blood Bank', 'Dialysis Center', 'Diagnostic Radiology'],
      isVerified: true,
      isActive: true
    });

    const hospital2 = await Hospital.create({
      name: 'Mufti Mahmood Memorial Teaching Hospital',
      slug: 'mufti-mahmood-memorial-hospital',
      description: '500-bed state-of-the-art teaching hospital attached to Gomal Medical College with advanced surgical and emergency facilities.',
      phone: '0966-740120',
      emergencyPhone: '0966-740125',
      email: 'mmmh@dikhanhealth.pk',
      address: 'Zafarabad, Bannu Road',
      area: 'Bannu Road',
      city: 'Dera Ismail Khan',
      coordinates: { lat: 31.854, lng: 70.887 },
      departments: ['Accident & Emergency', 'Orthopedics', 'Nephrology', 'General Medicine', 'Neurology'],
      bedCount: 220,
      is24Hours: true,
      isEmergency: true,
      ambulanceAvailable: true,
      services: ['Round-the-clock Emergency', 'CT Scan & MRI', 'Burn Unit', 'Ambulance Services'],
      isVerified: true,
      isActive: true
    });

    console.log('[Seed] 5. Creating Clinics in D.I. Khan...');
    const clinic1 = await Clinic.create({
      name: 'Al-Rehman Poly Clinic & Diagnostic Care',
      slug: 'al-rehman-poly-clinic',
      description: 'Multi-specialty outpatient medical clinic offering expert physician consultations and day-care services.',
      phone: '0966-712345',
      address: 'Opposite Model Town Gate, Faridabad',
      area: 'Faridabad',
      city: 'Dera Ismail Khan',
      coordinates: { lat: 31.831, lng: 70.903 },
      specialties: ['Cardiology', 'General Medicine', 'Pediatrics'],
      doctors: [doctor1._id, doctor3._id],
      is24Hours: false,
      isEmergency: false,
      services: ['ECG', 'Ultrasound', 'Specialist Clinics', 'Pharmacy Counter'],
      isVerified: true,
      isActive: true
    });

    console.log('[Seed] 6. Creating Pharmacies in D.I. Khan...');
    const pharmacy1 = await Pharmacy.create({
      name: 'Bismillah Medicos & Surgical Care',
      slug: 'bismillah-medicos',
      description: 'Comprehensive 24/7 retail and surgical pharmacy stocking authentic medicines and medical supplies.',
      phone: '0966-720987',
      whatsapp: '03337778899',
      address: 'Mission Road, Commercial Market',
      area: 'Mission Road',
      city: 'Dera Ismail Khan',
      licenseNumber: 'DIK-PHARM-2021-089',
      deliveryAvailable: true,
      is24Hours: true,
      isEmergency: true,
      services: ['Prescription Medicines', 'Doorstep Home Delivery', 'Insulin & Vaccines Cold Storage'],
      isVerified: true,
      isActive: true
    });

    console.log('[Seed] 7. Creating Diagnostic Laboratories in D.I. Khan...');
    const lab1 = await Laboratory.create({
      name: 'Chughtai Lab Collection Center D.I. Khan',
      slug: 'chughtai-lab-dikhan',
      description: 'ISO-accredited pathology and diagnostic laboratory offering automated blood tests with free home sample collection.',
      phone: '0966-733221',
      address: 'Circular Road, Near Saddar Police Station',
      area: 'Circular Road',
      city: 'Dera Ismail Khan',
      homeSampleCollection: true,
      reportDeliveryTime: 'Same Day / Online',
      tests: [
        { name: 'Complete Blood Count (CBC)', price: 750 },
        { name: 'Fasting Blood Sugar (FBS)', price: 300 },
        { name: 'Lipid Profile', price: 1800 },
        { name: 'Liver Function Test (LFT)', price: 1500 },
        { name: 'Renal Function Test (RFT)', price: 1200 },
        { name: 'Serum Creatinine', price: 400 },
        { name: 'HbA1c', price: 1600 }
      ],
      services: ['Pathology', 'Molecular Biology', 'Home Phlebotomy', 'Online Portal Reporting'],
      is24Hours: false,
      isEmergency: false,
      isVerified: true,
      isActive: true
    });

    console.log('[Seed] 8. Creating Reviews & Computing Aggregates...');
    // Review 1 on Doctor 1
    await Review.create({
      user: patient1._id,
      targetType: TARGET_TYPES.DOCTOR,
      targetId: doctor1._id,
      rating: 5,
      comment: 'Excellent cardiologist! Very thorough examination and explained the ECG results clearly.'
    });

    // Review 2 on Doctor 1
    await Review.create({
      user: patient2._id,
      targetType: TARGET_TYPES.DOCTOR,
      targetId: doctor1._id,
      rating: 5,
      comment: 'Best heart specialist in D.I. Khan. My mother felt great relief after his prescribed medication.'
    });

    // Review on Hospital 1
    await Review.create({
      user: patient3._id,
      targetType: TARGET_TYPES.HOSPITAL,
      targetId: hospital1._id,
      rating: 4,
      comment: 'Quick response in emergency trauma unit at midnight. Dedicated staff.'
    });

    // Recalculate target aggregates
    await recalculateRating(TARGET_TYPES.DOCTOR, doctor1._id);
    await recalculateRating(TARGET_TYPES.HOSPITAL, hospital1._id);

    console.log('[Seed] 9. Creating Initial Appointments...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    await Appointment.create({
      patient: patient1._id,
      doctor: doctor1._id,
      date: tomorrowStr,
      startTime: '16:00',
      endTime: '16:20',
      reason: 'Routine cardiology blood pressure review',
      status: APPOINTMENT_STATUS.CONFIRMED,
      note: 'Please bring latest ECG and lipid profile tests.'
    });

    console.log('----------------------------------------------------');
    console.log('  Database Seeding Completed Successfully!');
    console.log(`  Admin Email:    ${env.SEED_ADMIN_EMAIL}`);
    console.log(`  Admin Password: ${env.SEED_ADMIN_PASSWORD}`);
    console.log('----------------------------------------------------');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error(`[Seed Fatal Error] ${error.message}`);
    console.error(error.stack);
    await disconnectDB();
    process.exit(1);
  }
}

seedData();
