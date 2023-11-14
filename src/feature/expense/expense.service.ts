import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FailType } from '../../enum/failType.enum';
import { CreateExpenseDto } from './dto/createExpense.dto';
import { GetExpenseDto } from './dto/getExpense.dto';
import { UpdateExpenseDto } from './dto/updateExpense.dto';
import { Expense } from '../../entity/expense.entity';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
  ) {}

  async getExpenseById(expenseId: number): Promise<Expense> {
    const expenseDetail = await this.expenseRepository.findOne({
      where: {
        id: expenseId,
      },
      select: {
        id: true,
        spentDate: true,
        category: true,
        amount: true,
        memo: true,
        isCounted: true,
        user: {
          id: true,
          username: true,
        },
      },
      relations: {
        user: true,
      },
    });

    if (!expenseDetail) {
      throw new NotFoundException(FailType.EXPENSE_NOT_FOUND);
    }

    return expenseDetail;
  }

  async getExpenseListByQuery(getExpenseDto: GetExpenseDto): Promise<{
    expenses: Expense[];
    totalAmount: number;
    categoryTotalAmounts: Record<string, number>;
  }> {
    const { start, end, category, minimum, maximum } = getExpenseDto;

    const queryBuilder = this.expenseRepository.createQueryBuilder('expense');

    queryBuilder.select([
      'expense.id',
      'expense.spentDate',
      'expense.category',
      'expense.amount',
      'expense.isCounted',
    ]);

    // 1. start와 end를 통한 기간 필터링
    if (start && end) {
      queryBuilder.andWhere('expense.spentDate >= :start', { start });
      queryBuilder.andWhere('expense.spentDate <= :end', { end });
    }

    // 2. category 필터링
    if (category) {
      queryBuilder.andWhere('expense.category = :category', { category });
    }

    // 3. minimum 및 maximum 금액 필터링
    if (minimum !== undefined) {
      queryBuilder.andWhere('expense.amount >= :minimum', { minimum });
    }

    if (maximum !== undefined) {
      queryBuilder.andWhere('expense.amount <= :maximum', { maximum });
    }

    // 4. 모든 조건을 합쳐서 조회
    const expenses = await queryBuilder.getMany();

    // 5. 지출 합계 및 카테고리 별 지출 합계 계산
    const totalAmount = expenses
      .filter((expense) => expense.isCounted) // Filter out expenses with isCounted false
      .reduce((sum, expense) => sum + expense.amount, 0);

    // 카테고리 별 합계 계산
    const categoryTotalAmounts = expenses.reduce((result, expense) => {
      const category = expense.category;
      if (expense.isCounted) {
        result[category] = (result[category] || 0) + expense.amount;
      }
      return result;
    }, {});

    return {
      expenses,
      totalAmount,
      categoryTotalAmounts,
    };
  }

  async createExpense(
    userId: number,
    createExpenseDto: CreateExpenseDto,
  ): Promise<void> {
    try {
      await this.expenseRepository.save({
        user: { id: userId },
        spentDate: createExpenseDto.spentDate,
        category: createExpenseDto.category,
        amount: createExpenseDto.amount,
        memo: createExpenseDto.memo,
      });
    } catch (error) {
      throw new InternalServerErrorException(FailType.EXPENSE_CREATE_FAIL);
    }
  }

  async updateExpense(
    expenseId: number,
    updateExpenseDto: UpdateExpenseDto,
  ): Promise<void> {
    try {
      const expense = await this.findIfExpenseExists(expenseId);

      if (!expense) {
        throw new NotFoundException(FailType.EXPENSE_NOT_FOUND);
      }

      Object.assign(expense, updateExpenseDto);

      await this.expenseRepository.save(expense);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(FailType.EXPENSE_NOT_FOUND);
      } else {
        throw new InternalServerErrorException(FailType.EXPENSE_UPDATE_FAIL);
      }
    }
  }

  async deleteExpense(expenseId: number): Promise<void> {
    try {
      const expense = await this.findIfExpenseExists(expenseId);

      if (!expense) {
        throw new NotFoundException(FailType.EXPENSE_NOT_FOUND);
      }

      await this.expenseRepository.delete(expenseId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(FailType.EXPENSE_NOT_FOUND);
      } else {
        throw new InternalServerErrorException(FailType.EXPENSE_DELETE_FAIL);
      }
    }
  }

  async findIfExpenseExists(expenseId: number): Promise<Expense> {
    return await this.expenseRepository.findOne({
      where: { id: expenseId },
    });
  }

  /* 해당 월에 사용했던 총 지출 계산 */
  async getPreviousExpense(userId: number): Promise<number> {
    const today = new Date();
    const thisYear = today.getFullYear();
    const thisMonth = today.getMonth() + 1;

    const expenses = await this.expenseRepository
      .createQueryBuilder('expense')
      .where('expense.user_id = :userId', { userId })
      .andWhere('YEAR(expense.spentDate) = :year', { year: thisYear })
      .andWhere('MONTH(expense.spentDate) = :month', { month: thisMonth })
      .andWhere('expense.is_counted = true')
      .select('SUM(expense.amount)', 'totalAmount')
      .getRawOne();

    return expenses ? expenses.totalAmount : 0;
  }

  /* 오늘 지출한 내역 가져오기 */
  async getTodaysExpenses(userId: number): Promise<Expense[]> {
    const today = new Date();
    const todayFormatted = `${today.getFullYear()}-${
      today.getMonth() + 1
    }-${today.getDate()}`;

    return await this.expenseRepository.find({
      where: {
        user: { id: userId },
        isCounted: true,
        spentDate: todayFormatted,
      },
      select: {
        category: true,
        amount: true,
      },
    });
  }
}
