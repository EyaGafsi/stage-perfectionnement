import {IsNumber} from 'class-validator';  
export class AddMembersByMemberDto {
  @IsNumber()  
  memberIds: number[];
}
