import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScriptEntity } from './entities/scripts.entity';
import { CreateScriptDto } from './dto/create-script.dto';
import { UpdateScriptDto } from './dto/update-script.dto';

@Injectable()
export class ScriptsService {
  constructor(
    @InjectRepository(ScriptEntity)
    private scriptRepo: Repository<ScriptEntity>,
  ) {}

  // ---------------- CREATE ----------------
  async create(createScriptDto: CreateScriptDto, user: any) {
    if (!user.company) {
      throw new NotFoundException('User has no company');
    }

    const script = this.scriptRepo.create({
      ...createScriptDto,
      company: user.company, // 🔐 clé SaaS
    });

    return this.scriptRepo.save(script);
  }

  // ---------------- FIND ALL ----------------
  async findAll(user: any) {
    return this.scriptRepo.find({
      where: {
        company: { id: user.company.id },
      },
    });
  }

  // ---------------- FIND ONE ----------------
  async findOne(id: number, user: any) {
    const script = await this.scriptRepo.findOne({
      where: {
        id,
        company: { id: user.company.id },
      },
    });

    if (!script) {
      throw new NotFoundException('Script not found');
    }

    return script;
  }

  // ---------------- UPDATE ----------------
  async update(id: number, updateScriptDto: UpdateScriptDto, user: any) {
    const script = await this.findOne(id, user);

    this.scriptRepo.merge(script, updateScriptDto);
    return this.scriptRepo.save(script);
  }

  // ---------------- DELETE ----------------
  async remove(id: number, user: any) {
    const script = await this.findOne(id, user);
    return this.scriptRepo.remove(script);
  }
}
