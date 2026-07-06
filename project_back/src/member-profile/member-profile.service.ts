import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MemberProfileEntity } from './entities/member-profile.entity';
import { CreateMemberProfileDto, UpdateMemberProfileDto } from './dto/create-member-profile.dto';
import { UserEntity, UserRole } from 'src/user/entities/user.entity';
import { MemberProfileScoringService } from './member-profile-scoring.service';

@Injectable()
export class MemberProfileService {
  constructor(
    @InjectRepository(MemberProfileEntity)
    private profileRepo: Repository<MemberProfileEntity>,

    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,

    // ← Injecter le service de scoring
    private readonly scoringService: MemberProfileScoringService,
  ) {}

  // ─── Helpers d'accès ────────────────────────────────────────────────────

  private async verifyUserIsMember(userId: number): Promise<UserEntity> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['company'],
    });

    if (!user) throw new NotFoundException(`Utilisateur ${userId} introuvable`);

    if (user.role !== UserRole.MEMBER) {
      throw new ForbiddenException(
        `Impossible de créer un profil pour un utilisateur qui n'est pas MEMBER. Rôle actuel: ${user.role}`,
      );
    }

    return user;
  }

  private async checkPermissions(
    requesterUserId: number,
    targetUserId: number,
  ): Promise<{ requester: UserEntity; target: UserEntity }> {
    const [requester, target] = await Promise.all([
      this.userRepo.findOne({ where: { id: requesterUserId }, relations: ['company'] }),
      this.userRepo.findOne({ where: { id: targetUserId }, relations: ['company'] }),
    ]);

    if (!requester) throw new NotFoundException(`Utilisateur requérant ${requesterUserId} introuvable`);
    if (!target) throw new NotFoundException(`Utilisateur cible ${targetUserId} introuvable`);

    if (requester.id === target.id) return { requester, target };

    if (requester.role === UserRole.SUPER_ADMIN) return { requester, target };

    if (requester.role === UserRole.ADMIN_COMPANY || requester.role === UserRole.HR_MANAGER) {
      if (target.role !== UserRole.MEMBER) {
        throw new ForbiddenException(
          `Impossible de gérer un profil pour un utilisateur qui n'est pas MEMBER. Rôle: ${target.role}`,
        );
      }
      if (target.companyId !== requester.companyId) {
        throw new ForbiddenException(`Vous ne pouvez gérer que les profils des members de votre compagnie`);
      }
      return { requester, target };
    }

    throw new ForbiddenException(
      `Votre rôle (${requester.role}) n'a pas les permissions pour gérer les profils`,
    );
  }

  // ─── CRUD ───────────────────────────────────────────────────────────────

  async create(dto: CreateMemberProfileDto, requesterUserId?: number): Promise<MemberProfileEntity> {
    const targetUser = await this.verifyUserIsMember(dto.userId);

    if (requesterUserId) {
      await this.checkPermissions(requesterUserId, dto.userId);
    }

    const existingProfile = await this.profileRepo.findOne({ where: { userId: dto.userId } });
    if (existingProfile) {
      throw new ForbiddenException(`Un profil existe déjà pour cet utilisateur`);
    }

    const profile = this.profileRepo.create({
      ...dto,
      companyId: targetUser.companyId,
    });

    return this.profileRepo.save(profile);
  }

  /**
   * ✅ Récupère le profil ET recalcule le score à la volée avant de retourner.
   */
  async getProfile(userId: number, requesterUserId?: number): Promise<MemberProfileEntity> {
    if (requesterUserId) {
      await this.checkPermissions(requesterUserId, userId);
    }

    // Recalcul du score (lecture + calcul + persistance)
    const scored = await this.scoringService.computeAndPersist(userId);

    if (!scored) {
      throw new NotFoundException(`Profil introuvable pour l'utilisateur ${userId}`);
    }

    // Recharger avec les relations pour la réponse
    const profile = await this.profileRepo.findOne({
      where: { userId },
      relations: ['user', 'company'],
    });

    if (!profile) throw new NotFoundException(`Profil introuvable pour l'utilisateur ${userId}`);

    return profile;
  }

  async updateProfile(
    userId: number,
    dto: UpdateMemberProfileDto,
    requesterUserId?: number,
  ): Promise<MemberProfileEntity> {
    if (requesterUserId) {
      await this.checkPermissions(requesterUserId, userId);
    }

    const profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException(`Profil introuvable pour l'utilisateur ${userId}`);

    const updated: MemberProfileEntity = Object.assign(profile, dto);
    return this.profileRepo.save(updated);
  }

  async getAllProfiles(requesterUserId?: number): Promise<MemberProfileEntity[]> {
    let query = this.profileRepo
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user')
      .leftJoinAndSelect('profile.company', 'company');

    if (requesterUserId) {
      const requester = await this.userRepo.findOne({ where: { id: requesterUserId } });
      if (!requester) throw new NotFoundException(`Utilisateur requérant ${requesterUserId} introuvable`);

      if (requester.role !== UserRole.SUPER_ADMIN) {
        if (requester.role === UserRole.ADMIN_COMPANY || requester.role === UserRole.HR_MANAGER) {
          query = query.where('profile.companyId = :companyId', { companyId: requester.companyId });
        } else {
          throw new ForbiddenException(
            `Votre rôle (${requester.role}) n'a pas les permissions pour lister les profils`,
          );
        }
      }
    }

    return query.getMany();
    // Note : getAllProfiles ne déclenche pas le recalcul pour éviter N requêtes en masse.
    // Utiliser getProfile(userId) individuellement si le score à jour est nécessaire.
  }

  /**
   * ✅ Récupère MON profil ET recalcule le score à la volée.
   */
  async getMyProfile(userId: number): Promise<MemberProfileEntity> {
    const scored = await this.scoringService.computeAndPersist(userId);

    if (!scored) {
      throw new NotFoundException(`Aucun profil trouvé pour votre compte`);
    }

    const profile = await this.profileRepo.findOne({
      where: { userId },
      relations: ['user', 'company'],
    });

    if (!profile) throw new NotFoundException(`Aucun profil trouvé pour votre compte`);

    return profile;
  }
}