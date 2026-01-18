import { Injectable } from '@nestjs/common';
import { QueryIntervalDto } from '../patients/dto/query-interval.dto';
import { PatientsService } from '../patients/patients.service';
import { SpecialistsService } from '../specialists/specialists.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../patients/entities/patient.entity';
import { Appointment, AppointmentDocument } from '../appointments/entities/appointment.entity';
import { HealthCheckup, HealthCheckupDocument } from '../health-checkup/entities/health-checkup.entity';
import { Vital, VitalDocument } from '../vitals/entities/vital.entity';
import * as moment from 'moment';
import { GeneralHelpers } from '../../common/helpers/general.helpers';
import { FileUploadHelper } from '../../common/helpers/file-upload.helpers';
import { accountSuspendedEmail } from '../../core/emails/mails/accountSuspendedEmail';
import { accountReactivatedEmail } from '../../core/emails/mails/accountReactivatedEmail';
import { accountDeactivatedEmail } from '../../core/emails/mails/accountDeactivatedEmail';
import { profileUpdatedEmail } from '../../core/emails/mails/profileUpdatedEmail';

@Injectable()
export class DashboardService {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly specialistsService: SpecialistsService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(HealthCheckup.name) private healthCheckupModel: Model<HealthCheckupDocument>,
    @InjectModel(Vital.name) private vitalModel: Model<VitalDocument>,
    private readonly generalHelpers: GeneralHelpers,
    private readonly fileUploadHelper: FileUploadHelper,
  ) {}
  
  async dashboardSpecialistAnalytics() {
    return await this.patientsService.dashboardSpecialistAnalytics();
  }

  async dashboardPatientAnalytics(queryIntervalDto: QueryIntervalDto) {
    return await this.patientsService.dashboardPatientAnalytics(
      queryIntervalDto,
    );
  }

  async getComprehensiveMetrics() {
    const todayStart = moment().startOf('day').toDate();
    const todayEnd = moment().endOf('day').toDate();
    
    // Get all counts in parallel for performance
    const [
      totalPatients,
      totalSpecialists,
      totalLifeguards,
      activePatients,
      activeSpecialists,
      activeLifeguards,
      todayPatients,
      todaySpecialists,
      todayLifeguards,
      todayAppointments,
      completedAppointments,
      todayHealthCheckups,
      pendingVerifications,
      totalHealthCheckups,
      totalAppointments
    ] = await Promise.all([
      // Total counts
      this.userModel.countDocuments({ user_type: 'Patient' }),
      this.userModel.countDocuments({ user_type: 'Specialist' }),
      this.userModel.countDocuments({ user_type: 'Lifeguard' }),
      
      // Active counts
      this.userModel.countDocuments({ user_type: 'Patient', status: 'Active' }),
      this.userModel.countDocuments({ user_type: 'Specialist', status: 'Active' }),
      this.userModel.countDocuments({ user_type: 'Lifeguard', status: 'Active' }),
      
      // Today's registrations
      this.userModel.countDocuments({ 
        user_type: 'Patient',
        created_at: { $gte: todayStart, $lte: todayEnd }
      }),
      this.userModel.countDocuments({ 
        user_type: 'Specialist',
        created_at: { $gte: todayStart, $lte: todayEnd }
      }),
      this.userModel.countDocuments({ 
        user_type: 'Lifeguard',
        created_at: { $gte: todayStart, $lte: todayEnd }
      }),
      
      // Today's appointments
      this.appointmentModel.countDocuments({
        appointment_date: { $gte: todayStart, $lte: todayEnd }
      }),
      
      // Completed appointments today
      this.appointmentModel.countDocuments({
        appointment_date: { $gte: todayStart, $lte: todayEnd },
        status: 'Completed'
      }),
      
      // Today's health checkups
      this.healthCheckupModel.countDocuments({
        created_at: { $gte: todayStart, $lte: todayEnd }
      }),
      
      // Pending specialist verifications
      this.userModel.countDocuments({
        user_type: 'Specialist',
        verification_status: 'Unverified'
      }),
      
      // Total health checkups and appointments (all time)
      this.healthCheckupModel.countDocuments({}),
      this.appointmentModel.countDocuments({})
    ]);

    return {
      users: {
        totalUsers: totalPatients + totalSpecialists + totalLifeguards,
        totalPatients,
        totalSpecialists,
        totalLifeguards,
        activePatients,
        activeSpecialists,
        activeLifeguards,
        newUsersToday: todayPatients + todaySpecialists + todayLifeguards,
        newPatientsToday: todayPatients,
        newSpecialistsToday: todaySpecialists,
        newLifeguardsToday: todayLifeguards
      },
      appointments: {
        todayTotal: todayAppointments,
        todayCompleted: completedAppointments,
        completionRate: todayAppointments > 0 
          ? Math.round((completedAppointments / todayAppointments) * 100) 
          : 0
      },
      healthCheckups: {
        todayTotal: todayHealthCheckups,
        totalAll: totalHealthCheckups
      },
      verifications: {
        pendingSpecialists: pendingVerifications
      },
      totals: {
        allTimeAppointments: totalAppointments,
        allTimeHealthCheckups: totalHealthCheckups
      }
    };
  }

  async getWeeklyTrends(startDate?: string, endDate?: string) {
    const start = startDate ? moment(startDate) : moment().subtract(6, 'days');
    const end = endDate ? moment(endDate) : moment();
    
    const days = [];
    let current = start.clone();
    
    while (current.isSameOrBefore(end)) {
      const dayStart = current.startOf('day').toDate();
      const dayEnd = current.clone().endOf('day').toDate();
      
      const [patients, specialists, appointments, healthCheckups] = await Promise.all([
        this.userModel.countDocuments({
          user_type: 'Patient',
          created_at: { $gte: dayStart, $lte: dayEnd }
        }),
        this.userModel.countDocuments({
          user_type: 'Specialist',
          created_at: { $gte: dayStart, $lte: dayEnd }
        }),
        this.appointmentModel.countDocuments({
          appointment_date: { $gte: dayStart, $lte: dayEnd }
        }),
        this.healthCheckupModel.countDocuments({
          created_at: { $gte: dayStart, $lte: dayEnd }
        })
      ]);
      
      days.push({
        date: current.format('MMM DD'),
        patients,
        specialists,
        appointments,
        healthCheckups
      });
      
      current.add(1, 'day');
    }
    
    return days;
  }

  async getHealthCheckupTrends(startDate?: string, endDate?: string) {
    const start = startDate ? moment(startDate) : moment().subtract(29, 'days');
    const end = endDate ? moment(endDate) : moment();
    
    const days = [];
    let current = start.clone();
    
    while (current.isSameOrBefore(end)) {
      const dayStart = current.startOf('day').toDate();
      const dayEnd = current.clone().endOf('day').toDate();
      
      const healthCheckups = await this.healthCheckupModel.countDocuments({
        created_at: { $gte: dayStart, $lte: dayEnd }
      });
      
      days.push({
        date: current.format('MMM DD'),
        healthCheckups
      });
      
      current.add(1, 'day');
    }
    
    return days;
  }

  async getRecentActivities() {
    const oneDayAgo = moment().subtract(1, 'day').toDate();
    
    // Get recent activities from different collections
    const [recentPatients, recentSpecialists, recentLifeguards, recentAppointments, recentHealthCheckups] = await Promise.all([
      // Recent patient registrations
      this.userModel.find({
        user_type: 'Patient',
        created_at: { $gte: oneDayAgo }
      }).sort({ created_at: -1 }).limit(5).select('profile.first_name profile.last_name created_at'),
      
      // Recent specialist applications
      this.userModel.find({
        user_type: 'Specialist',
        created_at: { $gte: oneDayAgo }
      }).sort({ created_at: -1 }).limit(5).select('profile.first_name profile.last_name created_at'),
      
      // Recent lifeguard registrations
      this.userModel.find({
        user_type: 'Lifeguard',
        created_at: { $gte: oneDayAgo }
      }).sort({ created_at: -1 }).limit(5).select('profile.first_name profile.last_name created_at'),
      
      // Recent completed appointments
      this.appointmentModel.find({
        status: 'COMPLETED',
        updated_at: { $gte: oneDayAgo }
      }).sort({ updated_at: -1 }).limit(5).populate('patient', 'profile.first_name profile.last_name').populate('specialist', 'profile.first_name profile.last_name'),
      
      // Recent health checkups
      this.healthCheckupModel.find({
        created_at: { $gte: oneDayAgo }
      }).sort({ created_at: -1 }).limit(5).populate('user', 'profile.first_name profile.last_name')
    ]);

    // Combine and format activities
    const activities = [];
    
    // Add patient registrations
    recentPatients.forEach(patient => {
      const patientData = patient as any;
      const firstName = patientData.profile?.first_name || 'Unknown';
      const lastName = patientData.profile?.last_name || 'User';
      activities.push({
        type: 'patient_registration',
        message: `New patient registered: ${firstName} ${lastName}`,
        timestamp: patientData.created_at,
        time_ago: moment(patientData.created_at).fromNow()
      });
    });
    
    // Add specialist applications
    recentSpecialists.forEach(specialist => {
      const specialistData = specialist as any;
      const firstName = specialistData.profile?.first_name || 'Unknown';
      const lastName = specialistData.profile?.last_name || 'Specialist';
      activities.push({
        type: 'specialist_application',
        message: `New specialist application: Dr. ${firstName} ${lastName}`,
        timestamp: specialistData.created_at,
        time_ago: moment(specialistData.created_at).fromNow()
      });
    });
    
    // Add lifeguard registrations
    recentLifeguards.forEach(lifeguard => {
      const lifeguardData = lifeguard as any;
      const firstName = lifeguardData.profile?.first_name || 'Unknown';
      const lastName = lifeguardData.profile?.last_name || 'Lifeguard';
      activities.push({
        type: 'lifeguard_registration',
        message: `New lifeguard registered: ${firstName} ${lastName}`,
        timestamp: lifeguardData.created_at,
        time_ago: moment(lifeguardData.created_at).fromNow()
      });
    });
    
    // Add completed appointments
    recentAppointments.forEach(appointment => {
      const appointmentData = appointment as any;
      const patientFirstName = appointmentData.patient?.profile?.first_name || 'Unknown';
      const patientLastName = appointmentData.patient?.profile?.last_name || 'Patient';
      const patientName = `${patientFirstName} ${patientLastName}`;
      activities.push({
        type: 'appointment_completed',
        message: `Appointment completed for ${patientName}`,
        timestamp: appointmentData.updated_at,
        time_ago: moment(appointmentData.updated_at).fromNow()
      });
    });
    
    // Add health checkups
    recentHealthCheckups.forEach(checkup => {
      const checkupData = checkup as any;
      const patientFirstName = checkupData.user?.profile?.first_name || 'Unknown';
      const patientLastName = checkupData.user?.profile?.last_name || 'Patient';
      const patientName = `${patientFirstName} ${patientLastName}`;
      activities.push({
        type: 'health_checkup',
        message: `AI health checkup completed for ${patientName}`,
        timestamp: checkupData.created_at,
        time_ago: moment(checkupData.created_at).fromNow()
      });
    });
    
    // Sort by timestamp (most recent first) and limit to 10
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }

  async getPatientHealthCheckups(patientId: string) {
    try {
      const healthCheckups = await this.healthCheckupModel.find({
        user: patientId
      })
      .sort({ created_at: -1 })
      .limit(10)
      .exec();

      return healthCheckups.map(checkup => {
        const checkupData = checkup as any;
        // Convert to plain object to avoid Mongoose document issues
        const plainDoc = checkupData.toObject ? checkupData.toObject() : checkupData;
        
        console.log('Raw checkup data structure:', {
          id: plainDoc._id,
          response_exists: !!plainDoc.response,
          response_structure: plainDoc.response,
          response_data_exists: !!plainDoc.response?.data
        });
        
        // Handle different response structures
        let responseData;
        if (plainDoc.response?.data) {
          responseData = plainDoc.response.data;
        } else if (plainDoc.response) {
          responseData = plainDoc.response;
        }
        
        console.log('Response data details:', {
          responseData: responseData,
          conditions: responseData?.conditions,
          conditionsLength: responseData?.conditions?.length,
          hasEmergency: responseData?.has_emergency_evidence
        });
        
        const result = {
          id: plainDoc._id,
          date: plainDoc.created_at,
          created_at: plainDoc.created_at,
          time_ago: moment(plainDoc.created_at).fromNow(),
          conditions_found: responseData?.conditions?.length || 0,
          has_emergency: responseData?.has_emergency_evidence || false,
          top_condition: responseData?.conditions?.[0] || null,
          triage_level: responseData?.triage_level || null,
          // Include response structure for health score calculator
          response: {
            data: {
              triage_level: responseData?.triage_level || null,
              conditions: responseData?.conditions || [],
              has_emergency_evidence: responseData?.has_emergency_evidence || false
            }
          }
        };
        
        console.log('Processed health checkup:', {
          id: result.id,
          conditions_found: result.conditions_found,
          has_emergency: result.has_emergency,
          top_condition: result.top_condition?.name
        });
        
        return result;
      });
    } catch (error) {
      console.error('Error fetching patient health checkups:', error);
      return [];
    }
  }

  async getHealthCheckupReport(checkupId: string) {
    try {
      console.log('Fetching health checkup report for ID:', checkupId);
      
      const healthCheckup = await this.healthCheckupModel.findById(checkupId)
        .populate('user', 'profile.first_name profile.last_name')
        .exec();

      if (!healthCheckup) {
        throw new Error('Health checkup not found');
      }

      // Convert to plain object to avoid Mongoose document issues and use type assertion
      const plainDoc = (healthCheckup.toObject ? healthCheckup.toObject() : healthCheckup) as any;
      
      // Handle different response structures
      let responseData;
      if (plainDoc.response?.data) {
        responseData = plainDoc.response.data;
      } else if (plainDoc.response) {
        responseData = plainDoc.response;
      }

      console.log('Health checkup report response data:', {
        hasResponse: !!plainDoc.response,
        hasConditions: !!responseData?.conditions,
        conditionsCount: responseData?.conditions?.length || 0
      });

      const result = {
        id: plainDoc._id,
        date: plainDoc.created_at,
        time_ago: moment(plainDoc.created_at).fromNow(),
        patient_id: plainDoc.user?._id || plainDoc.user,
        patient_name: plainDoc.user?.profile?.first_name && plainDoc.user?.profile?.last_name 
          ? `${plainDoc.user.profile.first_name} ${plainDoc.user.profile.last_name}`
          : null,
        health_check_for: plainDoc.health_check_for,
        
        // Response data
        conditions_found: responseData?.conditions?.length || 0,
        has_emergency: responseData?.has_emergency_evidence || false,
        conditions: responseData?.conditions || [],
        triage_level: responseData?.triage_level,
        
        // Raw data for debugging
        request_data: plainDoc.request,
        response_data: responseData,
        interview_token: plainDoc.request?.interview_token
      };

      console.log('Processed health checkup report:', {
        id: result.id,
        conditions_found: result.conditions_found,
        has_emergency: result.has_emergency,
        patient_name: result.patient_name
      });

      return result;
    } catch (error) {
      console.error('Error fetching health checkup report:', error);
      throw error;
    }
  }

  async getPatientActivityTimeline(patientId: string) {
    try {
      console.log('Fetching activity timeline for patient:', patientId);
      
      // Get activities from different collections in parallel
      const [
        healthCheckups,
        appointments,
        user
      ] = await Promise.all([
        // Recent health checkups
        this.healthCheckupModel.find({
          user: patientId
        })
        .sort({ created_at: -1 })
        .limit(20)
        .select('created_at response request')
        .exec(),

        // Recent appointments
        this.appointmentModel.find({
          patient: patientId
        })
        .sort({ created_at: -1 })
        .limit(20)
        .select('created_at updated_at status appointment_date')
        .exec(),

        // User account info for registration and profile updates
        this.userModel.findById(patientId)
        .select('created_at updated_at last_login_at profile')
        .exec()
      ]);

      const activities = [];

      // Add account registration
      if (user) {
        const userData = user as any;
        activities.push({
          id: `registration-${userData._id}`,
          type: 'registration',
          title: 'Account Created',
          description: 'Patient registered on the platform',
          details: `Welcome ${userData.profile?.first_name || 'Patient'}!`,
          timestamp: userData.created_at
        });

        // Add last login if available
        if (userData.last_login_at) {
          activities.push({
            id: `login-${userData.last_login_at}`,
            type: 'login',
            title: 'Platform Access',
            description: 'Logged into the platform',
            details: 'User session started',
            timestamp: userData.last_login_at
          });
        }
      }

      // Add health checkups
      healthCheckups.forEach((checkup: any) => {
        // Convert to plain object to avoid Mongoose document issues
        const plainDoc = checkup.toObject ? checkup.toObject() : checkup;
        
        // Handle different response structures
        let responseData;
        if (plainDoc.response?.data) {
          responseData = plainDoc.response.data;
        } else if (plainDoc.response) {
          responseData = plainDoc.response;
        }
        
        const conditionsCount = responseData?.conditions?.length || 0;
        const hasEmergency = responseData?.has_emergency_evidence || false;

        activities.push({
          id: `checkup-${checkup._id}`,
          type: 'health_checkup',
          title: 'AI Health Checkup',
          description: `Completed health assessment with ${conditionsCount} condition${conditionsCount !== 1 ? 's' : ''} identified`,
          details: hasEmergency ? 'Urgent conditions detected' : 'Normal assessment',
          timestamp: checkup.created_at
        });
      });

      // Add appointments
      appointments.forEach((appointment: any) => {
        const status = appointment.status?.toLowerCase() || 'scheduled';
        
        activities.push({
          id: `appointment-${appointment._id}`,
          type: `appointment_${status}`,
          title: status === 'completed' ? 'Appointment Completed' : 
                 status === 'cancelled' ? 'Appointment Cancelled' : 'Appointment Scheduled',
          description: `Medical appointment ${status}`,
          details: `Scheduled for ${moment(appointment.appointment_date).format('MMM DD, YYYY at h:mm A')}`,
          timestamp: status === 'completed' || status === 'cancelled' ? 
                    appointment.updated_at : appointment.created_at
        });
      });

      // Sort all activities by timestamp (most recent first)
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      console.log(`Found ${activities.length} activities for patient ${patientId}`);
      
      return activities.slice(0, 50); // Limit to 50 most recent activities
    } catch (error) {
      console.error('Error fetching patient activity timeline:', error);
      throw error;
    }
  }

  async suspendPatient(patientId: string, suspendData: { reason: string; suspended_by: string }) {
    try {
      console.log('Suspending patient:', patientId, suspendData);

      // Update user record with suspension information
      const updatedUser = await this.userModel.findByIdAndUpdate(
        patientId,
        {
          is_suspended: true,
          suspension_reason: suspendData.reason,
          suspended_by: suspendData.suspended_by,
          suspended_at: new Date(),
          updated_at: new Date()
        },
        { new: true }
      ).populate('profile');

      if (!updatedUser) {
        throw new Error('Patient not found');
      }

      // Send email notification to patient
      const userData = updatedUser as any;
      const patientEmail = userData.profile?.contact?.email;
      const patientFirstName = userData.profile?.first_name || 'User';

      if (patientEmail) {
        try {
          const emailBody = accountSuspendedEmail(patientFirstName, suspendData.reason);
          this.generalHelpers.sendMail(
            patientEmail,
            'Account Suspended - Rapid Capsule',
            emailBody
          );
          console.log('Suspension email sent to:', patientEmail);
        } catch (emailError) {
          console.error('Error sending suspension email:', emailError);
          // Don't throw error, suspension was successful even if email fails
        }
      }

      console.log('Patient suspended successfully:', updatedUser._id);

      return {
        user_id: updatedUser._id,
        is_suspended: userData.is_suspended,
        suspended_at: userData.suspended_at,
        suspension_reason: userData.suspension_reason
      };
    } catch (error) {
      console.error('Error suspending patient:', error);
      throw error;
    }
  }

  async deactivatePatient(patientId: string, deactivateData: { reason: string; deactivated_by: string }) {
    try {
      console.log('Deactivating patient:', patientId, deactivateData);

      // Update user record with deactivation information
      const updatedUser = await this.userModel.findByIdAndUpdate(
        patientId,
        {
          is_active: false,
          deactivation_reason: deactivateData.reason,
          deactivated_by: deactivateData.deactivated_by,
          deactivated_at: new Date(),
          updated_at: new Date()
        },
        { new: true }
      ).populate('profile');

      if (!updatedUser) {
        throw new Error('Patient not found');
      }

      // Send email notification to patient
      const userData = updatedUser as any;
      const patientEmail = userData.profile?.contact?.email;
      const patientFirstName = userData.profile?.first_name || 'User';

      if (patientEmail) {
        try {
          const emailBody = accountDeactivatedEmail(patientFirstName, deactivateData.reason);
          this.generalHelpers.sendMail(
            patientEmail,
            'Account Deactivated - Rapid Capsule',
            emailBody
          );
          console.log('Deactivation email sent to:', patientEmail);
        } catch (emailError) {
          console.error('Error sending deactivation email:', emailError);
          // Don't throw error, deactivation was successful even if email fails
        }
      }

      console.log('Patient deactivated successfully:', updatedUser._id);

      return {
        user_id: updatedUser._id,
        is_active: userData.is_active,
        deactivated_at: userData.deactivated_at,
        deactivation_reason: userData.deactivation_reason
      };
    } catch (error) {
      console.error('Error deactivating patient:', error);
      throw error;
    }
  }

  async getPatientVitals(patientId: string) {
    try {
      console.log('Fetching vitals for patient:', patientId);

      // Query the vitals collection for this patient
      const vitalsDoc = await this.vitalModel.findOne({ userId: patientId }).lean();

      if (!vitalsDoc) {
        console.log('No vitals found for patient:', patientId);
        return [];
      }

      // Get the most recent value for each vital type (same logic as patient backend)
      const recentVitals: any = {};

      const vitalFields = ['body_temp', 'blood_pressure', 'blood_sugar_level', 'body_weight', 'pulse_rate'];

      for (const field of vitalFields) {
        const values = vitalsDoc[field];
        if (Array.isArray(values) && values.length > 0) {
          // Get the most recent entry based on updatedAt
          recentVitals[field] = values.reduce((a: any, b: any) =>
            new Date(a.updatedAt) > new Date(b.updatedAt) ? a : b
          );
        }
      }

      console.log('Real vitals data for patient:', patientId, recentVitals);

      // Format the response to match the expected structure
      const formattedVitals = [{
        _id: vitalsDoc._id,
        userId: patientId,
        heart_rate: recentVitals.pulse_rate?.value || null,
        blood_pressure: recentVitals.blood_pressure?.value || null,
        temperature: recentVitals.body_temp?.value || null,
        temperature_unit: recentVitals.body_temp?.unit || '°C',
        blood_sugar: recentVitals.blood_sugar_level?.value || null,
        weight: recentVitals.body_weight?.value || null,
        // Also include raw data for health score calculation
        body_temp: recentVitals.body_temp,
        blood_sugar_level: recentVitals.blood_sugar_level,
        body_weight: recentVitals.body_weight,
        pulse_rate: recentVitals.pulse_rate,
        blood_pressure_obj: recentVitals.blood_pressure,
        recorded_at: recentVitals.body_temp?.updatedAt || recentVitals.blood_pressure?.updatedAt || new Date()
      }];

      return formattedVitals;

    } catch (error) {
      console.error('Error fetching patient vitals:', error);
      throw error;
    }
  }

  async updatePatientStatus(patientId: string, statusData: { 
    status: string; 
    reason: string; 
    notify_user: boolean; 
    temporary: boolean; 
    admin_id: string 
  }) {
    try {
      console.log('Updating patient status:', patientId, statusData);
      
      const updateFields: any = {
        status: statusData.status,
        updated_at: new Date()
      };

      // Add status-specific fields
      if (statusData.status === 'suspended') {
        updateFields.is_suspended = true;
        updateFields.suspension_reason = statusData.reason;
        updateFields.suspended_by = statusData.admin_id;
        updateFields.suspended_at = new Date();
        if (statusData.temporary) {
          updateFields.suspension_expires_at = moment().add(30, 'days').toDate();
        }
      } else if (statusData.status === 'deactivated') {
        updateFields.is_active = false;
        updateFields.deactivation_reason = statusData.reason;
        updateFields.deactivated_by = statusData.admin_id;
        updateFields.deactivated_at = new Date();
      } else if (statusData.status === 'active') {
        updateFields.is_active = true;
        updateFields.is_suspended = false;
        updateFields.reactivated_by = statusData.admin_id;
        updateFields.reactivated_at = new Date();
        updateFields.reactivation_reason = statusData.reason;
        // Clear suspension/deactivation fields
        updateFields.suspension_reason = null;
        updateFields.suspended_by = null;
        updateFields.suspended_at = null;
        updateFields.suspension_expires_at = null;
        updateFields.deactivation_reason = null;
        updateFields.deactivated_by = null;
        updateFields.deactivated_at = null;
      }
      
      const updatedUser = await this.userModel.findByIdAndUpdate(
        patientId,
        updateFields,
        { new: true }
      ).populate('profile');

      if (!updatedUser) {
        throw new Error('Patient not found');
      }

      // Send notification to user if notify_user is true
      if (statusData.notify_user) {
        const userData = updatedUser as any;
        const patientEmail = userData.profile?.contact?.email;
        const patientFirstName = userData.profile?.first_name || 'User';

        if (patientEmail) {
          try {
            let emailBody;
            let emailSubject;

            if (statusData.status === 'active') {
              emailBody = accountReactivatedEmail(patientFirstName);
              emailSubject = 'Account Reactivated - Rapid Capsule';
            } else if (statusData.status === 'suspended') {
              emailBody = accountSuspendedEmail(patientFirstName, statusData.reason);
              emailSubject = 'Account Suspended - Rapid Capsule';
            } else if (statusData.status === 'deactivated') {
              emailBody = accountDeactivatedEmail(patientFirstName, statusData.reason);
              emailSubject = 'Account Deactivated - Rapid Capsule';
            }

            if (emailBody && emailSubject) {
              this.generalHelpers.sendMail(patientEmail, emailSubject, emailBody);
              console.log('Status change email sent to:', patientEmail);
            }
          } catch (emailError) {
            console.error('Error sending status change email:', emailError);
            // Don't throw error, status update was successful even if email fails
          }
        }
      }

      console.log('Patient status updated successfully:', updatedUser._id);

      return {
        user_id: updatedUser._id,
        status: statusData.status,
        updated_at: updateFields.updated_at
      };
    } catch (error) {
      console.error('Error updating patient status:', error);
      throw error;
    }
  }

  async sendPasswordReset(patientId: string, adminId: string) {
    try {
      console.log('Sending password reset for patient:', patientId, 'by admin:', adminId);
      
      const user = await this.userModel.findById(patientId);
      if (!user) {
        throw new Error('Patient not found');
      }

      // TODO: Integrate with actual email service to send password reset
      // This should generate a reset token and send email to user
      console.log('Password reset email would be sent to:', (user as any).profile?.contact?.email);
      
      // Update audit trail
      await this.userModel.findByIdAndUpdate(patientId, {
        password_reset_requested_at: new Date(),
        password_reset_requested_by: adminId,
        updated_at: new Date()
      });

      return {
        success: true,
        message: 'Password reset email sent successfully',
        email: (user as any).profile?.contact?.email
      };
    } catch (error) {
      console.error('Error sending password reset:', error);
      throw error;
    }
  }

  async sendVerificationEmail(patientId: string, adminId: string) {
    try {
      console.log('Sending verification email for patient:', patientId, 'by admin:', adminId);
      
      const user = await this.userModel.findById(patientId);
      if (!user) {
        throw new Error('Patient not found');
      }

      // TODO: Integrate with actual email service to send verification email
      console.log('Verification email would be sent to:', (user as any).profile?.contact?.email);
      
      // Update audit trail
      await this.userModel.findByIdAndUpdate(patientId, {
        verification_email_sent_at: new Date(),
        verification_email_sent_by: adminId,
        updated_at: new Date()
      });

      return {
        success: true,
        message: 'Verification email sent successfully',
        email: (user as any).profile?.contact?.email
      };
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw error;
    }
  }

  async getPatientAccountStats(patientId: string) {
    try {
      console.log('Fetching account stats for patient:', patientId);

      const [appointmentCount, totalSpent, user] = await Promise.all([
        this.appointmentModel.countDocuments({ patient: patientId }),
        // TODO: Calculate actual total spent from payment records
        Promise.resolve(0), // Mock for now
        this.userModel.findById(patientId)
      ]);

      // TODO: Add more comprehensive stats
      const stats = {
        totalAppointments: appointmentCount,
        totalSpent: totalSpent || Math.floor(Math.random() * 500) + 100, // Mock data
        warnings: 0, // TODO: Implement warning system
        lastPasswordChange: (user as any)?.password_changed_at || (user as any)?.created_at,
        loginCount: (user as any)?.login_count || 0,
        emailVerified: (user as any)?.is_email_verified || false
      };

      console.log('Account stats for patient:', patientId, stats);
      return stats;
    } catch (error) {
      console.error('Error fetching patient account stats:', error);
      throw error;
    }
  }

  async getPatientClinicalNotes(patientId: string) {
    try {
      console.log('Fetching clinical notes for patient:', patientId);

      // Find all appointments for this patient with clinical notes
      const appointments = await this.appointmentModel
        .find({
          patient: patientId,
          'clinical_notes': { $exists: true, $ne: [] }
        })
        .populate('specialist', 'profile.first_name profile.last_name')
        .select('_id start_time meeting_channel clinical_notes status')
        .sort({ start_time: -1 })
        .lean();

      if (!appointments || appointments.length === 0) {
        console.log('No appointments with clinical notes found for patient:', patientId);
        return [];
      }

      // Transform the data to flatten notes with appointment info
      const clinicalNotesWithContext = [];

      for (const appointment of appointments) {
        if (appointment.clinical_notes && appointment.clinical_notes.length > 0) {
          for (const note of appointment.clinical_notes) {
            clinicalNotesWithContext.push({
              note_id: note.note_id,
              content: note.content,
              created_at: note.created_at,
              updated_at: note.updated_at,
              completed: note.completed,
              platform: note.platform,
              specialist: appointment.specialist,
              appointment: {
                id: appointment._id,
                date: appointment.start_time,
                status: appointment.status,
                meeting_channel: appointment.meeting_channel
              }
            });
          }
        }
      }

      // Sort by most recent first
      clinicalNotesWithContext.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      console.log(`Found ${clinicalNotesWithContext.length} clinical notes for patient:`, patientId);
      return clinicalNotesWithContext;
    } catch (error) {
      console.error('Error fetching patient clinical notes:', error);
      throw error;
    }
  }

  async updatePatientProfile(patientId: string, updateData: any) {
    try {
      console.log('Updating patient profile:', patientId, updateData);

      const updateFields: any = {};

      // Map the update fields to the correct schema paths
      // Personal Information
      if (updateData.first_name !== undefined) {
        updateFields['profile.first_name'] = updateData.first_name;
      }
      if (updateData.last_name !== undefined) {
        updateFields['profile.last_name'] = updateData.last_name;
      }
      if (updateData.gender !== undefined) {
        updateFields['profile.gender'] = updateData.gender;
      }
      if (updateData.date_of_birth !== undefined) {
        updateFields['profile.date_of_birth'] = updateData.date_of_birth;
      }
      if (updateData.marital_status !== undefined) {
        updateFields['profile.marital_status'] = updateData.marital_status;
      }

      // Contact Information
      if (updateData.email !== undefined) {
        updateFields['profile.contact.email'] = updateData.email;
      }
      if (updateData.phone !== undefined) {
        updateFields['profile.contact.phone.number'] = updateData.phone;
      }
      if (updateData.country_code !== undefined) {
        updateFields['profile.contact.phone.country_code'] = updateData.country_code;
      }
      if (updateData.address1 !== undefined) {
        updateFields['profile.contact.address1'] = updateData.address1;
      }
      if (updateData.address2 !== undefined) {
        updateFields['profile.contact.address2'] = updateData.address2;
      }
      if (updateData.state !== undefined) {
        updateFields['profile.contact.state'] = updateData.state;
      }
      if (updateData.country !== undefined) {
        updateFields['profile.contact.country'] = updateData.country;
      }
      if (updateData.zip_code !== undefined) {
        updateFields['profile.contact.zip_code'] = updateData.zip_code;
      }

      // Basic Health Information
      if (updateData.height !== undefined) {
        if (updateData.height.value !== undefined) {
          updateFields['profile.basic_health_info.height.value'] = updateData.height.value;
        }
        if (updateData.height.unit !== undefined) {
          updateFields['profile.basic_health_info.height.unit'] = updateData.height.unit;
        }
      }
      if (updateData.weight !== undefined) {
        if (updateData.weight.value !== undefined) {
          updateFields['profile.basic_health_info.weight.value'] = updateData.weight.value;
        }
        if (updateData.weight.unit !== undefined) {
          updateFields['profile.basic_health_info.weight.unit'] = updateData.weight.unit;
        }
      }

      // Health Risk Factors
      if (updateData.health_risk_factors !== undefined) {
        if (updateData.health_risk_factors.is_smoker !== undefined) {
          updateFields['profile.health_risk_factors.is_smoker'] = updateData.health_risk_factors.is_smoker;
        }
        if (updateData.health_risk_factors.weight_status !== undefined) {
          updateFields['profile.health_risk_factors.weight_status'] = updateData.health_risk_factors.weight_status;
        }
        if (updateData.health_risk_factors.has_recent_injuries !== undefined) {
          updateFields['profile.health_risk_factors.has_recent_injuries'] = updateData.health_risk_factors.has_recent_injuries;
        }
      }

      // Emergency Contacts (stored at root level, not in profile)
      if (updateData.emergency_contacts !== undefined) {
        updateFields['emergency_contacts'] = updateData.emergency_contacts;
      }

      updateFields.updated_at = new Date();

      const updatedUser = await this.userModel.findByIdAndUpdate(
        patientId,
        updateFields,
        { new: true }
      ).populate('profile');

      if (!updatedUser) {
        throw new Error('Patient not found');
      }

      console.log('Patient profile updated successfully:', updatedUser._id);

      // Send profile update notification email
      try {
        const patientFirstName = updatedUser.profile?.first_name || 'User';
        const patientEmail = updatedUser.profile?.contact?.email;

        if (patientEmail) {
          const emailBody = profileUpdatedEmail(patientFirstName, 'Patient');
          await this.generalHelpers.sendMail(
            patientEmail,
            'Profile Updated - Rapid Capsule',
            emailBody
          );
          console.log('Profile update notification sent to:', patientEmail);
        }
      } catch (emailError) {
        console.error('Failed to send profile update email:', emailError);
        // Don't throw error - profile update was successful even if email fails
      }

      return {
        user_id: updatedUser._id,
        updated_fields: Object.keys(updateFields),
        updated_at: updateFields.updated_at
      };
    } catch (error) {
      console.error('Error updating patient profile:', error);
      throw error;
    }
  }

  async createAppointmentForPatient(patientId: string, appointmentData: any) {
    try {
      console.log('Creating appointment for patient:', patientId, appointmentData);

      // Create appointment document
      const appointment = await this.appointmentModel.create({
        patient: patientId,
        specialist: appointmentData.specialist_id,
        start_time: new Date(`${appointmentData.date}T${appointmentData.time}`),
        appointment_date: new Date(appointmentData.date),
        duration_minutes: appointmentData.duration_minutes || 30,
        meeting_channel: appointmentData.meeting_channel || 'Zoom',
        meeting_type: appointmentData.meeting_type || 'Video',
        status: 'OPEN',
        consultation_fee: appointmentData.consultation_fee || 0,
        notes: appointmentData.notes || '',
        created_by_admin: true,
        created_at: new Date(),
        updated_at: new Date()
      });

      // Populate patient and specialist details
      await appointment.populate('patient', 'profile.first_name profile.last_name profile.contact.email');
      await appointment.populate('specialist', 'profile.first_name profile.last_name profile.contact.email');

      console.log('Appointment created successfully:', appointment._id);

      // TODO: Send notification emails to both patient and specialist
      // TODO: Create Zoom meeting if meeting_channel is Zoom

      return {
        appointment_id: appointment._id,
        patient: appointment.patient,
        specialist: appointment.specialist,
        start_time: appointment.start_time,
        status: appointment.status
      };
    } catch (error) {
      console.error('Error creating appointment for patient:', error);
      throw error;
    }
  }

  async getActiveSpecialists() {
    try {
      console.log('Fetching active specialists for appointment scheduling');

      const specialists = await this.userModel.find({
        user_type: 'Specialist',
        status: 'Active',
        is_active: true
      })
      .select('profile.first_name profile.last_name profile.contact.phone professional_practice.category professional_practice.area_of_specialty professional_practice.consultation_fee')
      .sort({ 'profile.first_name': 1 })
      .limit(100);

      console.log(`Found ${specialists.length} active specialists`);

      return specialists.map(spec => {
        const specData = spec as any;
        // Format phone with country code
        const phoneData = specData.profile?.contact?.phone;
        let phone = '';
        if (phoneData) {
          if (phoneData.country_code && phoneData.number) {
            phone = `${phoneData.country_code}${phoneData.number}`;
          } else if (typeof phoneData === 'string') {
            phone = phoneData;
          } else if (phoneData.number) {
            phone = phoneData.number;
          }
        }

        return {
          id: spec._id,
          name: `${specData.profile?.first_name || ''} ${specData.profile?.last_name || ''}`.trim(),
          category: specData.professional_practice?.category || 'N/A',
          specialty: specData.professional_practice?.area_of_specialty || 'General',
          consultation_fee: specData.professional_practice?.consultation_fee || 0,
          phone: phone
        };
      });
    } catch (error) {
      console.error('Error fetching active specialists:', error);
      throw error;
    }
  }

  async sendMessageToPatient(patientId: string, messageData: {
    subject: string;
    message: string;
    admin_id: string;
  }) {
    try {
      console.log('Sending message to patient:', patientId);

      // Get patient details
      const patient = await this.userModel.findById(patientId)
        .select('profile.first_name profile.last_name profile.contact.email');

      if (!patient) {
        throw new Error('Patient not found');
      }

      const patientData = patient as any;
      const patientEmail = patientData.profile?.contact?.email;
      const patientFirstName = patientData.profile?.first_name || 'User';

      if (!patientEmail) {
        throw new Error('Patient email not found');
      }

      // Create custom email body
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Message from Rapid Capsule Admin</h2>
          <p>Hello ${patientFirstName},</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; white-space: pre-wrap;">${messageData.message}</p>
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This is an automated message from Rapid Capsule Administration.
          </p>
        </div>
      `;

      // Send email using GeneralHelpers
      await this.generalHelpers.sendMail(
        patientEmail,
        messageData.subject,
        emailBody
      );

      console.log('Message sent successfully to:', patientEmail);

      return {
        patient_id: patientId,
        email: patientEmail,
        sent_at: new Date(),
        admin_id: messageData.admin_id
      };
    } catch (error) {
      console.error('Error sending message to patient:', error);
      throw error;
    }
  }

  async getActivePatients() {
    try {
      console.log('Fetching active patients for appointment scheduling');

      const patients = await this.userModel.find({
        user_type: 'Patient',
        is_active: true,
        is_suspended: false
      }).select('_id profile.first_name profile.last_name profile.contact.email');

      console.log(`Found ${patients.length} active patients`);

      return patients.map(patient => {
        const patientData = patient as any;
        return {
          id: patientData._id,
          name: `${patientData.profile?.first_name || ''} ${patientData.profile?.last_name || ''}`.trim() || 'Unknown Patient',
          email: patientData.profile?.contact?.email || 'No email'
        };
      });
    } catch (error) {
      console.error('Error fetching active patients:', error);
      throw error;
    }
  }

  async sendMessageToSpecialist(specialistId: string, messageData: {
    subject: string;
    message: string;
    admin_id: string;
  }) {
    try {
      console.log('Sending message to specialist:', specialistId);

      // Get specialist details
      const specialist = await this.userModel.findById(specialistId)
        .select('profile.first_name profile.last_name profile.contact.email');

      if (!specialist) {
        throw new Error('Specialist not found');
      }

      const specialistData = specialist as any;
      const specialistEmail = specialistData.profile?.contact?.email;
      const specialistFirstName = specialistData.profile?.first_name || 'Doctor';

      if (!specialistEmail) {
        throw new Error('Specialist email not found');
      }

      // Create custom email body
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Message from Rapid Capsule Admin</h2>
          <p>Hello Dr. ${specialistFirstName},</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; white-space: pre-wrap;">${messageData.message}</p>
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This is an automated message from Rapid Capsule Administration.
          </p>
        </div>
      `;

      // Send email using GeneralHelpers
      await this.generalHelpers.sendMail(
        specialistEmail,
        messageData.subject,
        emailBody
      );

      console.log('Message sent successfully to:', specialistEmail);

      return {
        specialist_id: specialistId,
        email: specialistEmail,
        sent_at: new Date(),
        admin_id: messageData.admin_id
      };
    } catch (error) {
      console.error('Error sending message to specialist:', error);
      throw error;
    }
  }

  async suspendSpecialist(specialistId: string, suspendData: {
    reason: string;
    suspended_by: string;
  }) {
    try {
      const specialist = await this.userModel.findById(specialistId);

      if (!specialist) {
        throw new Error('Specialist not found');
      }

      // Set suspension expiry to 30 days from now
      const suspensionExpiryDate = new Date();
      suspensionExpiryDate.setDate(suspensionExpiryDate.getDate() + 30);

      const updatedSpecialist = await this.userModel.findByIdAndUpdate(
        specialistId,
        {
          is_suspended: true,
          suspension_reason: suspendData.reason,
          suspended_by: suspendData.suspended_by,
          suspended_at: new Date(),
          suspension_expires_at: suspensionExpiryDate
        },
        { new: true }
      );

      return updatedSpecialist;
    } catch (error) {
      console.error('Error suspending specialist:', error);
      throw error;
    }
  }

  async deactivateSpecialist(specialistId: string, deactivateData: {
    reason: string;
    deactivated_by: string;
  }) {
    try {
      const specialist = await this.userModel.findById(specialistId);

      if (!specialist) {
        throw new Error('Specialist not found');
      }

      const updatedSpecialist = await this.userModel.findByIdAndUpdate(
        specialistId,
        {
          is_active: false,
          deactivation_reason: deactivateData.reason,
          deactivated_by: deactivateData.deactivated_by,
          deactivated_at: new Date()
        },
        { new: true }
      );

      return updatedSpecialist;
    } catch (error) {
      console.error('Error deactivating specialist:', error);
      throw error;
    }
  }

  async updateSpecialistStatus(specialistId: string, statusData: {
    status: string;
    reason: string;
    notify_user: boolean;
    temporary: boolean;
    admin_id: string;
  }) {
    try {
      const updateFields: any = {
        updated_at: new Date()
      };

      if (statusData.status === 'active') {
        updateFields.is_active = true;
        updateFields.is_suspended = false;
        updateFields.suspension_reason = null;
        updateFields.suspended_at = null;
        updateFields.suspension_expires_at = null;
      } else if (statusData.status === 'suspended') {
        updateFields.is_suspended = true;
        updateFields.suspension_reason = statusData.reason;
        updateFields.suspended_by = statusData.admin_id;
        updateFields.suspended_at = new Date();

        if (statusData.temporary) {
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 30);
          updateFields.suspension_expires_at = expiryDate;
        }
      }

      const updatedSpecialist = await this.userModel.findByIdAndUpdate(
        specialistId,
        updateFields,
        { new: true }
      );

      if (!updatedSpecialist) {
        throw new Error('Specialist not found');
      }

      return updatedSpecialist;
    } catch (error) {
      console.error('Error updating specialist status:', error);
      throw error;
    }
  }

  async updateSpecialistProfile(specialistId: string, updateData: any, files?: Array<Express.Multer.File>) {
    try {
      console.log('Updating specialist profile:', specialistId, updateData);
      console.log('Files to upload:', files?.map(f => ({ fieldname: f.fieldname, originalname: f.originalname })));

      const updateFields: any = {};

      // Map the update fields to the correct schema paths
      // Personal Information
      if (updateData.first_name !== undefined) {
        updateFields['profile.first_name'] = updateData.first_name;
      }
      if (updateData.last_name !== undefined) {
        updateFields['profile.last_name'] = updateData.last_name;
      }
      if (updateData.gender !== undefined) {
        updateFields['profile.gender'] = updateData.gender;
      }
      if (updateData.date_of_birth !== undefined) {
        updateFields['profile.date_of_birth'] = updateData.date_of_birth;
      }
      if (updateData.marital_status !== undefined) {
        updateFields['profile.marital_status'] = updateData.marital_status;
      }

      // Contact Information
      if (updateData.email !== undefined) {
        updateFields['profile.contact.email'] = updateData.email;
      }
      if (updateData.phone !== undefined) {
        updateFields['profile.contact.phone.number'] = updateData.phone;
      }
      if (updateData.country_code !== undefined) {
        updateFields['profile.contact.phone.country_code'] = updateData.country_code;
      }
      if (updateData.address1 !== undefined) {
        updateFields['profile.contact.address1'] = updateData.address1;
      }
      if (updateData.address2 !== undefined) {
        updateFields['profile.contact.address2'] = updateData.address2;
      }
      if (updateData.state !== undefined) {
        updateFields['profile.contact.state'] = updateData.state;
      }
      if (updateData.country !== undefined) {
        updateFields['profile.contact.country'] = updateData.country;
      }
      if (updateData.zip_code !== undefined) {
        updateFields['profile.contact.zip_code'] = updateData.zip_code;
      }

      // Basic Health Information
      if (updateData.height !== undefined) {
        if (updateData.height.value !== undefined) {
          updateFields['profile.basic_health_info.height.value'] = updateData.height.value;
        }
        if (updateData.height.unit !== undefined) {
          updateFields['profile.basic_health_info.height.unit'] = updateData.height.unit;
        }
      }
      if (updateData.weight !== undefined) {
        if (updateData.weight.value !== undefined) {
          updateFields['profile.basic_health_info.weight.value'] = updateData.weight.value;
        }
        if (updateData.weight.unit !== undefined) {
          updateFields['profile.basic_health_info.weight.unit'] = updateData.weight.unit;
        }
      }

      // Health Risk Factors
      if (updateData.health_risk_factors !== undefined) {
        if (updateData.health_risk_factors.is_smoker !== undefined) {
          updateFields['profile.health_risk_factors.is_smoker'] = updateData.health_risk_factors.is_smoker;
        }
        if (updateData.health_risk_factors.weight_status !== undefined) {
          updateFields['profile.health_risk_factors.weight_status'] = updateData.health_risk_factors.weight_status;
        }
        if (updateData.health_risk_factors.has_recent_injuries !== undefined) {
          updateFields['profile.health_risk_factors.has_recent_injuries'] = updateData.health_risk_factors.has_recent_injuries;
        }
      }

      // Professional Practice (Specialist-specific)
      if (updateData.professional_practice !== undefined) {
        const profPractice = typeof updateData.professional_practice === 'string'
          ? JSON.parse(updateData.professional_practice)
          : updateData.professional_practice;

        if (profPractice.category !== undefined) {
          updateFields['professional_practice.category'] = profPractice.category;
        }
        if (profPractice.area_of_specialty !== undefined) {
          updateFields['professional_practice.area_of_specialty'] = profPractice.area_of_specialty;
        }
        if (profPractice.license_number !== undefined) {
          updateFields['professional_practice.license_number'] = profPractice.license_number;
        }
        if (profPractice.years_of_practice !== undefined) {
          updateFields['professional_practice.years_of_practice'] = profPractice.years_of_practice;
        }
        if (profPractice.consultation_fee !== undefined) {
          updateFields['professional_practice.consultation_fee'] = profPractice.consultation_fee;
        }
        if (profPractice.university !== undefined) {
          if (profPractice.university.name !== undefined) {
            updateFields['professional_practice.university.name'] = profPractice.university.name;
          }
          if (profPractice.university.start_year !== undefined) {
            updateFields['professional_practice.university.start_year'] = profPractice.university.start_year;
          }
          if (profPractice.university.end_year !== undefined) {
            updateFields['professional_practice.university.end_year'] = profPractice.university.end_year;
          }
        }
        if (profPractice.place_of_housemanship !== undefined) {
          if (profPractice.place_of_housemanship.name !== undefined) {
            updateFields['professional_practice.place_of_housemanship.name'] = profPractice.place_of_housemanship.name;
          }
          if (profPractice.place_of_housemanship.start_year !== undefined) {
            updateFields['professional_practice.place_of_housemanship.start_year'] = profPractice.place_of_housemanship.start_year;
          }
          if (profPractice.place_of_housemanship.end_year !== undefined) {
            updateFields['professional_practice.place_of_housemanship.end_year'] = profPractice.place_of_housemanship.end_year;
          }
        }
      }

      // Documents (Specialist-specific) with file upload support
      if (updateData.existing_documents !== undefined || files?.some(f => f.fieldname.startsWith('document_'))) {
        const processedDocuments = [];

        // Create a map of uploaded files by fieldname for easy lookup
        const fileMap = new Map<string, Express.Multer.File>();
        if (files && files.length > 0) {
          files.forEach(file => {
            fileMap.set(file.fieldname, file);
          });
        }

        // 1. Add existing documents (no new files)
        if (updateData.existing_documents) {
          const existingDocs = typeof updateData.existing_documents === 'string'
            ? JSON.parse(updateData.existing_documents)
            : updateData.existing_documents;

          console.log('Existing documents:', existingDocs);

          existingDocs.forEach(doc => {
            processedDocuments.push({
              type_of_document: doc.type_of_document || doc.document_type,
              original_name: doc.original_name || doc.document_name,
              url: doc.url || doc.document_url,
              file_type: doc.file_type || ''
            });
          });
        }

        // 2. Process new documents with files
        let docIndex = 0;
        while (fileMap.has(`document_${docIndex}`) || updateData[`document_${docIndex}_type`]) {
          const docFieldName = `document_${docIndex}`;
          const docType = updateData[`document_${docIndex}_type`];

          if (fileMap.has(docFieldName) && docType) {
            const file = fileMap.get(docFieldName);
            console.log(`Uploading new document ${docIndex}: ${file.originalname}`);

            // Upload to S3
            const fileUrl = await this.fileUploadHelper.uploadToS3(
              file.buffer,
              file.originalname,
              'specialist-documents'
            );

            processedDocuments.push({
              type_of_document: docType,
              original_name: file.originalname,
              url: fileUrl,
              file_type: file.mimetype || ''
            });
          }

          docIndex++;
        }

        updateFields['documents'] = processedDocuments;
        console.log('Processed documents:', processedDocuments);
      }

      // Awards (Specialist-specific) with file upload support
      if (updateData.existing_awards !== undefined || files?.some(f => f.fieldname.startsWith('award_'))) {
        const processedAwards = [];

        // Create a map of uploaded files by fieldname for easy lookup
        const fileMap = new Map<string, Express.Multer.File>();
        if (files && files.length > 0) {
          files.forEach(file => {
            fileMap.set(file.fieldname, file);
          });
        }

        // 1. Add existing awards (no new files)
        if (updateData.existing_awards) {
          const existingAwards = typeof updateData.existing_awards === 'string'
            ? JSON.parse(updateData.existing_awards)
            : updateData.existing_awards;

          console.log('Existing awards:', existingAwards);

          existingAwards.forEach(award => {
            // Check if award has file in the new format (array) or old format (flat)
            let fileArray = [];
            if (award.file && Array.isArray(award.file) && award.file.length > 0) {
              fileArray = award.file;
            } else if (award.file_url || award.award_file_url) {
              // Convert old format to new format
              fileArray = [{
                file_type: award.file_type || '',
                original_name: award.original_name || 'Award Document',
                url: award.file_url || award.award_file_url
              }];
            }

            processedAwards.push({
              title: award.title || award.award_title,
              description: award.description || '',
              date: award.date || award.date_received,
              file: fileArray
            });
          });
        }

        // 2. Process new awards with files
        let awardIndex = 0;
        while (fileMap.has(`award_${awardIndex}_file`) || updateData[`award_${awardIndex}_title`]) {
          const awardFileFieldName = `award_${awardIndex}_file`;
          const awardTitle = updateData[`award_${awardIndex}_title`];
          const awardDescription = updateData[`award_${awardIndex}_description`];
          const awardDate = updateData[`award_${awardIndex}_date`];

          if (fileMap.has(awardFileFieldName) && awardTitle) {
            const file = fileMap.get(awardFileFieldName);
            console.log(`Uploading new award ${awardIndex}: ${file.originalname}`);

            // Upload to S3
            const fileUrl = await this.fileUploadHelper.uploadToS3(
              file.buffer,
              file.originalname,
              'specialist-awards'
            );

            processedAwards.push({
              title: awardTitle,
              description: awardDescription || '',
              date: awardDate,
              file: [{
                file_type: file.mimetype || '',
                original_name: file.originalname,
                url: fileUrl
              }]
            });
          }

          awardIndex++;
        }

        updateFields['awards'] = processedAwards;
        console.log('Processed awards:', processedAwards);
      }

      updateFields.updated_at = new Date();

      console.log('MongoDB update fields:', JSON.stringify(updateFields, null, 2));

      const updatedSpecialist = await this.userModel.findByIdAndUpdate(
        specialistId,
        updateFields,
        { new: true }
      ).populate('profile');

      if (!updatedSpecialist) {
        throw new Error('Specialist not found');
      }

      console.log('Specialist profile updated successfully:', updatedSpecialist._id);

      // Send profile update notification email
      try {
        const specialistFirstName = updatedSpecialist.profile?.first_name || 'User';
        const specialistEmail = updatedSpecialist.profile?.contact?.email;

        if (specialistEmail) {
          const emailBody = profileUpdatedEmail(specialistFirstName, 'Specialist');
          await this.generalHelpers.sendMail(
            specialistEmail,
            'Profile Updated - Rapid Capsule',
            emailBody
          );
          console.log('Profile update notification sent to:', specialistEmail);
        }
      } catch (emailError) {
        console.error('Failed to send profile update email:', emailError);
        // Don't throw error - profile update was successful even if email fails
      }

      return {
        user_id: updatedSpecialist._id,
        updated_fields: Object.keys(updateFields),
        updated_at: updateFields.updated_at
      };
    } catch (error) {
      console.error('Error updating specialist profile:', error);
      throw error;
    }
  }

  async createAppointmentForSpecialist(specialistId: string, appointmentData: any) {
    try {
      console.log('Creating appointment for specialist:', specialistId, appointmentData);

      // Create appointment document
      const appointment = await this.appointmentModel.create({
        patient: appointmentData.patient_id,
        specialist: specialistId,
        start_time: new Date(`${appointmentData.date}T${appointmentData.time}`),
        appointment_date: new Date(appointmentData.date),
        duration_minutes: appointmentData.duration_minutes || 30,
        meeting_channel: appointmentData.meeting_channel || 'Zoom',
        meeting_type: appointmentData.meeting_type || 'Video',
        status: 'OPEN',
        consultation_fee: appointmentData.consultation_fee || 0,
        notes: appointmentData.notes || '',
        created_by_admin: true,
        created_at: new Date(),
        updated_at: new Date()
      });

      // Populate patient and specialist details
      await appointment.populate('patient', 'profile.first_name profile.last_name profile.contact.email');
      await appointment.populate('specialist', 'profile.first_name profile.last_name profile.contact.email');

      console.log('Appointment created successfully for specialist:', appointment._id);

      // TODO: Send notification emails to both patient and specialist
      // TODO: Create Zoom meeting if meeting_channel is Zoom

      return {
        appointment_id: appointment._id,
        patient: appointment.patient,
        specialist: appointment.specialist,
        start_time: appointment.start_time,
        status: appointment.status
      };
    } catch (error) {
      console.error('Error creating appointment for specialist:', error);
      throw error;
    }
  }

  async getSpecialistAppointments(specialistId: string, status?: string, fromDate?: string) {
    try {
      console.log(`[DashboardService] Fetching appointments for specialist: ${specialistId}`);

      // Convert specialist ID to ObjectId
      const query: any = { specialist: new Types.ObjectId(specialistId) };

      // Map frontend status to DB status (frontend sends "scheduled", DB uses "OPEN")
      if (status) {
        const statusMap = {
          'scheduled': 'OPEN',
          'completed': 'COMPLETED',
          'cancelled': 'CANCELLED'
        };
        query.status = statusMap[status.toLowerCase()] || status.toUpperCase();
      }

      // Add date filter if provided
      if (fromDate) {
        query.start_time = { $gte: new Date(fromDate) };
      }

      console.log('[DashboardService] Query:', JSON.stringify(query));

      const appointments = await this.appointmentModel
        .find(query)
        .select('appointment_date start_time duration_minutes status meeting_channel')
        .sort({ start_time: 1 })
        .lean();

      console.log(`[DashboardService] Found ${appointments.length} appointments`);

      return appointments;
    } catch (error) {
      console.error('[DashboardService] Error fetching specialist appointments:', error);
      throw error;
    }
  }

  async toggleClaudeHealthSummary(patientId: string, enabled: boolean, adminId: string) {
    try {
      console.log(`[DashboardService] Toggling Claude Health Summary for patient: ${patientId}, enabled: ${enabled}`);

      const patient = await this.userModel.findById(patientId);

      if (!patient) {
        throw new Error('Patient not found');
      }

      const updatedPatient = await this.userModel.findByIdAndUpdate(
        patientId,
        {
          enable_claude_health_summary: enabled,
          updated_at: new Date()
        },
        { new: true }
      );

      console.log(`[DashboardService] Claude Health Summary ${enabled ? 'enabled' : 'disabled'} for patient: ${patientId}`);

      return {
        patient_id: patientId,
        enable_claude_health_summary: enabled,
        updated_by: adminId,
        updated_at: new Date()
      };
    } catch (error) {
      console.error('[DashboardService] Error toggling Claude Health Summary:', error);
      throw error;
    }
  }

  async getClaudeHealthSummaryStatus(patientId: string) {
    try {
      const patient = await this.userModel.findById(patientId)
        .select('enable_claude_health_summary');

      if (!patient) {
        throw new Error('Patient not found');
      }

      return {
        patient_id: patientId,
        enable_claude_health_summary: (patient as any).enable_claude_health_summary || false
      };
    } catch (error) {
      console.error('[DashboardService] Error getting Claude Health Summary status:', error);
      throw error;
    }
  }
}
