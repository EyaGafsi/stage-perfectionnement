import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyEntity } from 'src/companies/entities/company.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UserEntity } from '../user/entities/user.entity';
import { ProjectEntity } from 'src/projects/entities/project.entity';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(CompanyEntity)
    private readonly companyRepository: Repository<CompanyEntity>,
  ) {}

  // -------------------- CREATE --------------------
  async create(createCompanyDto: CreateCompanyDto): Promise<CompanyEntity> {
    // Vérifier si le nom existe déjà
    const existing = await this.companyRepository.findOne({ where: { name: createCompanyDto.name } });
    if (existing) {
      throw new BadRequestException(`Company with name "${createCompanyDto.name}" already exists`);
    }

    const company = this.companyRepository.create(createCompanyDto);
    return this.companyRepository.save(company);
  }

  // -------------------- FIND ALL --------------------
  async findAll(): Promise<CompanyEntity[]> {
    return this.companyRepository.find({ relations: ['users', 'projects'] });
  }

  // -------------------- FIND ONE BY ID --------------------
  async findById(id: number): Promise<CompanyEntity> {
    const company = await this.companyRepository.findOne({
      where: { id },
      relations: ['users', 'projects'],
    });
    if (!company) throw new NotFoundException(`Company with ID ${id} not found`);
    return company;
  }

  // -------------------- FIND ONE BY NAME --------------------
  async findByName(name: string): Promise<CompanyEntity> {
    const company = await this.companyRepository.findOne({
      where: { name },
      relations: ['users', 'projects'],
    });
    if (!company) throw new NotFoundException(`Company with name "${name}" not found`);
    return company;
  }

  // -------------------- UPDATE --------------------
  async update(id: number, updateCompanyDto: UpdateCompanyDto): Promise<CompanyEntity> {
    const company = await this.findById(id);

    // Vérifier si le nouveau nom existe déjà pour une autre société
    if (updateCompanyDto.name) {
      const existing = await this.companyRepository.findOne({ where: { name: updateCompanyDto.name } });
      if (existing && existing.id !== id) {
        throw new BadRequestException(`Company with name "${updateCompanyDto.name}" already exists`);
      }
    }

    Object.assign(company, updateCompanyDto);
    return this.companyRepository.save(company);
  }

  // -------------------- DELETE --------------------
  async remove(id: number): Promise<{ message: string }> {
    const company = await this.findById(id);

    // Suppression en cascade des utilisateurs et projets
    if (company.users && company.users.length > 0) {
      for (const user of company.users) {
        await this.companyRepository.manager.remove(UserEntity, user);
      }
    }

    if (company.projects && company.projects.length > 0) {
      for (const project of company.projects) {
        await this.companyRepository.manager.remove(ProjectEntity, project);
      }
    }

    await this.companyRepository.remove(company);
    return { message: `Company with ID ${id} and all related users and projects have been removed` };
  }
}
