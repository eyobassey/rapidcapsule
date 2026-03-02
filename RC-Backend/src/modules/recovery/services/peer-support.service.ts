import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  PeerAssignment,
  PeerAssignmentDocument,
  PeerAssignmentStatus,
} from '../entities/peer-assignment.entity';
import {
  RecoveryProfile,
  RecoveryProfileDocument,
} from '../entities/recovery-profile.entity';

@Injectable()
export class PeerSupportService {
  constructor(
    @InjectModel(PeerAssignment.name)
    private peerAssignmentModel: Model<PeerAssignmentDocument>,
    @InjectModel(RecoveryProfile.name)
    private profileModel: Model<RecoveryProfileDocument>,
  ) {}

  /**
   * Create a peer assignment (specialist assigns).
   */
  async assign(dto: {
    patient_id: string;
    peer_supporter_id: string;
    check_in_schedule?: { frequency?: string; preferred_time?: string; preferred_method?: string };
  }, assignedById: string) {
    // Check no active assignment already exists
    const existing = await this.peerAssignmentModel.findOne({
      patient: new Types.ObjectId(dto.patient_id),
      status: { $in: [PeerAssignmentStatus.ACTIVE, PeerAssignmentStatus.PENDING] },
      deleted_at: { $exists: false },
    });

    if (existing) {
      throw new BadRequestException(
        'Patient already has an active peer assignment. End it before creating a new one.',
      );
    }

    // Auto-match scoring
    const matchCriteria = await this.calculateMatchScore(
      dto.patient_id,
      dto.peer_supporter_id,
    );

    const assignment = await this.peerAssignmentModel.create({
      patient: new Types.ObjectId(dto.patient_id),
      peer_supporter: new Types.ObjectId(dto.peer_supporter_id),
      assigned_by: new Types.ObjectId(assignedById),
      status: PeerAssignmentStatus.PENDING,
      match_criteria: matchCriteria,
      check_in_schedule: dto.check_in_schedule || { frequency: 'weekly', preferred_method: 'chat' },
    });

    return assignment.toObject();
  }

  /**
   * List peer assignments for a user (as patient or supporter).
   */
  async list(userId: string, role: 'patient' | 'supporter' = 'patient', includeEnded = false) {
    const query: any = { deleted_at: { $exists: false } };
    if (role === 'patient') {
      query.patient = new Types.ObjectId(userId);
    } else {
      query.peer_supporter = new Types.ObjectId(userId);
    }

    if (!includeEnded) {
      query.status = { $in: [PeerAssignmentStatus.ACTIVE, PeerAssignmentStatus.PENDING] };
    }

    return this.peerAssignmentModel
      .find(query)
      .sort({ created_at: -1 })
      .populate('patient', 'profile.first_name profile.last_name profile.profile_image')
      .populate('peer_supporter', 'profile.first_name profile.last_name profile.profile_image')
      .populate('assigned_by', 'profile.first_name profile.last_name')
      .lean();
  }

  /**
   * Get a single assignment by ID.
   */
  async getById(assignmentId: string) {
    const assignment = await this.peerAssignmentModel
      .findOne({
        _id: new Types.ObjectId(assignmentId),
        deleted_at: { $exists: false },
      })
      .populate('patient', 'profile.first_name profile.last_name profile.profile_image')
      .populate('peer_supporter', 'profile.first_name profile.last_name profile.profile_image')
      .lean();

    if (!assignment) throw new NotFoundException('Peer assignment not found');
    return assignment;
  }

  /**
   * Activate a pending assignment (after both parties consent).
   */
  async activate(assignmentId: string, userId: string, role: 'patient' | 'peer') {
    const assignment = await this.peerAssignmentModel.findOne({
      _id: new Types.ObjectId(assignmentId),
      deleted_at: { $exists: false },
    });

    if (!assignment) throw new NotFoundException('Peer assignment not found');

    const update: any = {};
    if (role === 'patient') {
      update.patient_consent_date = new Date();
    } else {
      update.peer_consent_date = new Date();
    }

    await this.peerAssignmentModel.updateOne({ _id: assignment._id }, { $set: update });

    // Check if both consented
    const refreshed = await this.peerAssignmentModel.findById(assignment._id);
    if (refreshed && refreshed.patient_consent_date && refreshed.peer_consent_date) {
      await this.peerAssignmentModel.updateOne(
        { _id: assignment._id },
        { $set: { status: PeerAssignmentStatus.ACTIVE } },
      );
    }

    return { assignment_id: assignmentId, consent_given: role, status: refreshed?.status };
  }

  /**
   * End a peer assignment.
   */
  async end(assignmentId: string, userId: string, reason?: string) {
    const assignment = await this.peerAssignmentModel.findOne({
      _id: new Types.ObjectId(assignmentId),
      deleted_at: { $exists: false },
    });

    if (!assignment) throw new NotFoundException('Peer assignment not found');

    await this.peerAssignmentModel.updateOne(
      { _id: assignment._id },
      {
        $set: {
          status: PeerAssignmentStatus.ENDED,
          ended_at: new Date(),
          end_reason: reason || 'Ended by user',
        },
      },
    );

    return { assignment_id: assignmentId, ended: true };
  }

  /**
   * Log a check-in for the peer assignment.
   */
  async logCheckIn(
    assignmentId: string,
    loggedById: string,
    data: {
      method?: string;
      notes?: string;
      mood_before?: number;
      mood_after?: number;
    },
  ) {
    const assignment = await this.peerAssignmentModel.findOne({
      _id: new Types.ObjectId(assignmentId),
      status: PeerAssignmentStatus.ACTIVE,
      deleted_at: { $exists: false },
    });

    if (!assignment) throw new NotFoundException('Active peer assignment not found');

    await this.peerAssignmentModel.updateOne(
      { _id: assignment._id },
      {
        $push: {
          check_ins: {
            date: new Date(),
            method: data.method,
            notes: data.notes,
            mood_before: data.mood_before,
            mood_after: data.mood_after,
            logged_by: new Types.ObjectId(loggedById),
          },
        },
      },
    );

    return {
      assignment_id: assignmentId,
      check_in_count: assignment.check_ins.length + 1,
      logged: true,
    };
  }

  /**
   * Calculate match score between patient and peer supporter.
   */
  private async calculateMatchScore(patientId: string, peerId: string) {
    const [patientProfile, peerProfile] = await Promise.all([
      this.profileModel.findOne({ user: new Types.ObjectId(patientId) }).lean(),
      this.profileModel.findOne({ user: new Types.ObjectId(peerId) }).lean(),
    ]);

    let score = 0;
    const criteria = {
      shared_substance: false,
      age_proximity: false,
      gender_match: false,
      match_score: 0,
    };

    if (patientProfile && peerProfile) {
      // Check shared substance
      const patientSubstances =
        (patientProfile.substance_use_history as any[])?.map((s) => s.substance) || [];
      const peerSubstances =
        (peerProfile.substance_use_history as any[])?.map((s) => s.substance) || [];
      const shared = patientSubstances.some((s: string) => peerSubstances.includes(s));
      if (shared) {
        criteria.shared_substance = true;
        score += 40;
      }

      // Gender match is scored but not required
      criteria.gender_match = false; // Would need user entity join — set as false for now
      score += 10; // Base score

      // Recovery stage proximity
      if (peerProfile.status === 'completed') {
        score += 30; // Graduated peers are ideal supporters
      } else if (peerProfile.status === 'active') {
        score += 20;
      }
    }

    criteria.match_score = Math.min(score, 100);
    return criteria;
  }
}
