import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CompanyEntity } from '../companies/entities/company.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  // -------------------- CRÉER UN UTILISATEUR --------------------
  async create(data: Partial<UserEntity>): Promise<Omit<UserEntity, 'password'>> {
    // Vérifier email et téléphone uniques
    if (data.email && (await this.userRepository.findOne({ where: { email: data.email } }))) {
      throw new BadRequestException('Email already exists');
    }
    if (data.numtel && (await this.userRepository.findOne({ where: { numtel: data.numtel } }))) {
      throw new BadRequestException('Phone number already exists');
    }

    // Hasher le mot de passe si fourni
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    const user = this.userRepository.create(data);
    const savedUser = await this.userRepository.save(user);

    const { password, ...result } = savedUser;
    return result;
  }

  // -------------------- TROUVER TOUS LES UTILISATEURS --------------------
  async findAll(): Promise<Omit<UserEntity, 'password'>[]> {
    const users = await this.userRepository.find({ relations: ['company'] });
    return users.map(({ password, ...u }) => u);
  }

  // -------------------- TROUVER UN UTILISATEUR PAR ID --------------------
  async findById(id: number): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['company'],
    });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  // -------------------- TROUVER UN UTILISATEUR PAR EMAIL --------------------
async findByEmail(email: string): Promise<UserEntity> {
  const user = await this.userRepository
    .createQueryBuilder('user')
    .addSelect('user.password')
    .leftJoinAndSelect('user.company', 'company')
    .where('user.email = :email', { email })
    .getOne();

  if (!user) {
    throw new NotFoundException(`User with email ${email} not found`);
  }

  return user;
}


  // -------------------- TROUVER TOUS LES UTILISATEURS D'UNE SOCIÉTÉ --------------------
// Remplacer l'ancienne méthode par celle-ci :
  async findByCompany(companyId: number): Promise<Omit<UserEntity, 'password'>[]> {
    const users = await this.userRepository.find({
      where: { company: { id: companyId } },
      relations: ['company'],
    });
    return users.map(({ password, ...u }) => u);
  }

  // -------------------- METTRE À JOUR UN UTILISATEUR --------------------
  async update(id: number, updateUserDto: UpdateUserDto): Promise<Omit<UserEntity, 'password'>> {
    const user = await this.findById(id);

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    Object.assign(user, updateUserDto);
    const updatedUser = await this.userRepository.save(user);

    const { password, ...result } = updatedUser;
    return result;
  }

  // -------------------- SUPPRIMER UN UTILISATEUR --------------------
  async remove(id: number): Promise<{ message: string }> {
    const user = await this.findById(id);
    await this.userRepository.remove(user);
    return { message: `User with ID ${id} has been removed` };
  }
}
