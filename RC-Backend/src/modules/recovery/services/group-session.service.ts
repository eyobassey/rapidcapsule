import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  GroupSession,
  GroupSessionDocument,
  GroupSessionStatus,
} from '../entities/group-session.entity';

@Injectable()
export class GroupSessionService {
  constructor(
    @InjectModel(GroupSession.name)
    private groupSessionModel: Model<GroupSessionDocument>,
  ) {}

  /**
   * Create a new group session (specialist/facilitator only).
   */
  async create(dto: any, facilitatorId: string) {
    const session = await this.groupSessionModel.create({
      ...dto,
      facilitator: new Types.ObjectId(facilitatorId),
      co_facilitator: dto.co_facilitator
        ? new Types.ObjectId(dto.co_facilitator)
        : undefined,
    });
    return session.toObject();
  }

  /**
   * List group sessions with filtering.
   */
  async list(filters: {
    status?: string;
    category?: string;
    facilitator?: string;
    upcoming?: boolean;
    page?: number;
    limit?: number;
  }) {
    const query: any = { deleted_at: { $exists: false } };

    if (filters.status) query.status = filters.status;
    if (filters.category) query.session_category = filters.category;
    if (filters.facilitator)
      query.facilitator = new Types.ObjectId(filters.facilitator);
    if (filters.upcoming) {
      query.scheduled_date = { $gte: new Date() };
      query.status = { $in: [GroupSessionStatus.SCHEDULED, GroupSessionStatus.IN_PROGRESS] };
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      this.groupSessionModel
        .find(query)
        .sort({ scheduled_date: 1 })
        .skip(skip)
        .limit(limit)
        .populate('facilitator', 'profile.first_name profile.last_name')
        .populate('co_facilitator', 'profile.first_name profile.last_name')
        .lean(),
      this.groupSessionModel.countDocuments(query),
    ]);

    return {
      data: sessions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get a single group session by ID.
   */
  async getById(sessionId: string) {
    const session = await this.groupSessionModel
      .findOne({
        _id: new Types.ObjectId(sessionId),
        deleted_at: { $exists: false },
      })
      .populate('facilitator', 'profile.first_name profile.last_name')
      .populate('co_facilitator', 'profile.first_name profile.last_name')
      .populate('enrolled_participants.user', 'profile.first_name profile.last_name')
      .lean();

    if (!session) throw new NotFoundException('Group session not found');
    return session;
  }

  /**
   * Join a group session.
   */
  async join(sessionId: string, userId: string) {
    const session = await this.groupSessionModel.findOne({
      _id: new Types.ObjectId(sessionId),
      deleted_at: { $exists: false },
    });

    if (!session) throw new NotFoundException('Group session not found');

    if (session.status === GroupSessionStatus.COMPLETED || session.status === GroupSessionStatus.CANCELLED) {
      throw new BadRequestException('This session is no longer accepting participants');
    }

    const activeParticipants = session.enrolled_participants.filter(
      (p) => p.status === 'enrolled',
    );

    // Check if already enrolled
    const existing = session.enrolled_participants.find(
      (p) => p.user.toString() === userId,
    );
    if (existing && existing.status === 'enrolled') {
      throw new BadRequestException('Already enrolled in this session');
    }

    // Check capacity
    const status =
      activeParticipants.length >= session.max_participants
        ? 'waitlisted'
        : 'enrolled';

    if (existing) {
      // Re-enrol withdrawn participant
      await this.groupSessionModel.updateOne(
        { _id: session._id, 'enrolled_participants.user': new Types.ObjectId(userId) },
        {
          $set: {
            'enrolled_participants.$.status': status,
            'enrolled_participants.$.enrolled_at': new Date(),
          },
        },
      );
    } else {
      await this.groupSessionModel.updateOne(
        { _id: session._id },
        {
          $push: {
            enrolled_participants: {
              user: new Types.ObjectId(userId),
              enrolled_at: new Date(),
              status,
            },
          },
        },
      );
    }

    return {
      session_id: sessionId,
      enrollment_status: status,
      message:
        status === 'waitlisted'
          ? 'Session is full. You have been added to the waitlist.'
          : 'Successfully enrolled in the group session.',
    };
  }

  /**
   * Leave a group session.
   */
  async leave(sessionId: string, userId: string) {
    const result = await this.groupSessionModel.updateOne(
      {
        _id: new Types.ObjectId(sessionId),
        'enrolled_participants.user': new Types.ObjectId(userId),
      },
      {
        $set: { 'enrolled_participants.$.status': 'withdrawn' },
      },
    );

    if (result.modifiedCount === 0) {
      throw new NotFoundException('Not enrolled in this session');
    }

    return { session_id: sessionId, message: 'Successfully withdrawn from session' };
  }

  /**
   * Log attendance for a session (facilitator only).
   */
  async logAttendance(
    sessionId: string,
    facilitatorId: string,
    attendanceRecords: Array<{ user_id: string; attended: boolean; notes?: string }>,
  ) {
    const session = await this.groupSessionModel.findOne({
      _id: new Types.ObjectId(sessionId),
      deleted_at: { $exists: false },
    });

    if (!session) throw new NotFoundException('Group session not found');

    if (
      session.facilitator.toString() !== facilitatorId &&
      session.co_facilitator?.toString() !== facilitatorId
    ) {
      throw new ForbiddenException('Only the facilitator can log attendance');
    }

    const attendance = attendanceRecords.map((r) => ({
      user: new Types.ObjectId(r.user_id),
      attended: r.attended,
      joined_at: r.attended ? new Date() : undefined,
      notes: r.notes,
    }));

    await this.groupSessionModel.updateOne(
      { _id: session._id },
      {
        $set: {
          attendance,
          status: GroupSessionStatus.COMPLETED,
        },
      },
    );

    return {
      session_id: sessionId,
      total_attended: attendanceRecords.filter((r) => r.attended).length,
      total_absent: attendanceRecords.filter((r) => !r.attended).length,
    };
  }

  /**
   * Update session notes and topics (facilitator only).
   */
  async updateNotes(
    sessionId: string,
    facilitatorId: string,
    notes: string,
    topics?: string[],
  ) {
    const session = await this.groupSessionModel.findOne({
      _id: new Types.ObjectId(sessionId),
      deleted_at: { $exists: false },
    });

    if (!session) throw new NotFoundException('Group session not found');

    if (
      session.facilitator.toString() !== facilitatorId &&
      session.co_facilitator?.toString() !== facilitatorId
    ) {
      throw new ForbiddenException('Only the facilitator can update session notes');
    }

    const update: any = { session_notes: notes };
    if (topics) update.topics_covered = topics;

    await this.groupSessionModel.updateOne({ _id: session._id }, { $set: update });

    return { session_id: sessionId, updated: true };
  }

  /**
   * Get sessions a user is enrolled in.
   */
  async getMyEnrolledSessions(userId: string, upcoming = true) {
    const query: any = {
      'enrolled_participants.user': new Types.ObjectId(userId),
      'enrolled_participants.status': 'enrolled',
      deleted_at: { $exists: false },
    };

    if (upcoming) {
      query.scheduled_date = { $gte: new Date() };
    }

    return this.groupSessionModel
      .find(query)
      .sort({ scheduled_date: 1 })
      .populate('facilitator', 'profile.first_name profile.last_name')
      .lean();
  }
}
