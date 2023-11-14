import { StatisticsType } from '../../../enum/statisticsType';
import { IsEnum } from 'class-validator';

export class GetExpenseStatisticsDto {
  @IsEnum(StatisticsType)
  type!: StatisticsType;
}
