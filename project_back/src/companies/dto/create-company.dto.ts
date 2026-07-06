// create-company.dto.ts
import { IsNotEmpty, IsOptional, IsString, IsEmail, IsPhoneNumber } from 'class-validator';

export class CreateCompanyDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsPhoneNumber() // le "null" permet tout format international
  phone?: string;
}
