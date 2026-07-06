import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PostDocument = Post & Document;

// ============================================
// APPLICANT SUB-SCHEMA
// ============================================

@Schema({ _id: true, timestamps: true })
export class Applicant {
  // ── Infos de base ──────────────────────────
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop()
  phone?: string;

  @Prop()
  cvLink?: string;

  // ── Données extraites du CV ────────────────
  @Prop({ default: '' })
  experience_text: string;

  @Prop({ default: 0 })
  years_experience: number;

  @Prop({ default: '' })
  education_text: string;

  @Prop({ default: 0 })
  years_education: number;

  @Prop({ type: [String], default: [] })
  skills: string[];

  @Prop({
    type: String,
    enum: ['Junior', 'Intermédiaire', 'Senior/Expert'],
    default: 'Junior',
  })
  level: string;

  // ── Scores individuels (0-100) ─────────────
  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  experienceScore: number;

  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  educationScore: number;

  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  skillsScore: number;

  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  levelScore: number;

  // ── Score total pondéré (0-100) ────────────
  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  score: number;

  // ── Méta ──────────────────────────────────
  @Prop({
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending',
  })
  cvParsingStatus: string;

  @Prop({ default: Date.now })
  appliedAt: Date;

  @Prop()
  cvParsedAt?: Date;
}

export const ApplicantSchema = SchemaFactory.createForClass(Applicant);

// ============================================
// POST SCHEMA
// ============================================

@Schema({ timestamps: true })
export class Post {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  // ── Expérience ─────────────────────────────
  @Prop({ default: '' })
  experienceDescription: string;

  @Prop({ type: Number, default: 0 })
  minYearsExperience: number;

  @Prop({ type: Number })
  maxYearsExperience?: number;

  // ── Formation ──────────────────────────────
  @Prop({ default: '' })
  educationDescription: string;

  @Prop({ type: Number, default: 0 })
  minYearsEducation: number;

  // ── Compétences ────────────────────────────
  @Prop({ type: [String], default: [] })
  requiredSkills: string[];

  @Prop({ type: [String], default: [] })
  preferredSkills: string[];

  @Prop({ default: '' })
  skillsDescription: string;

  // ── Niveau ─────────────────────────────────
  @Prop({
    type: String,
    enum: ['Junior', 'Intermédiaire', 'Senior/Expert'],
    required: true,
  })
  requiredLevel: string;

  @Prop({ default: '' })
  levelDescription: string;

  // ── Tags & Keywords ────────────────────────
  @Prop({ type: [String], default: [] })
  keywords: string[];

  @Prop({ type: [String], default: [] })
  tags: string[];

  // ── Métadonnées ────────────────────────────
  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: true })
  createdById: string;

  @Prop()
  createdByRole?: string;

  @Prop()
  companyId?: string;

  // ── Candidats ─────────────────────────────
  @Prop({ type: [ApplicantSchema], default: [] })
  applicants: Applicant[];

  @Prop({ type: Number, default: 0 })
  applicantsCount: number;

  @Prop({ type: Number, default: 0 })
  matchedApplicantsCount: number; // score >= 70

  // ── Score moyen de tous les candidats ─────
  @Prop({ type: Number, default: 0 })
  score: number;
}

export const PostSchema = SchemaFactory.createForClass(Post);

PostSchema.index({ createdById: 1, isActive: 1 });
PostSchema.index({ companyId: 1 });
PostSchema.index({ requiredLevel: 1 });
PostSchema.index({ keywords: 1 });