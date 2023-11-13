import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import { FailType } from '../../enum/failType.enum';
import { Expense } from '../../entity/expense.entity';
import { ExpenseLib } from '../expense/expenseLib';
import { StatisticsLib } from '../statistics/statisticsLib';
import { BudgetLib } from '../budget/budgetLib';

@Injectable()
export class DailyService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    private readonly expenseLib: ExpenseLib,
    private readonly statisticsLib: StatisticsLib,
    private readonly budgetLib: BudgetLib,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  async getTodaysExpenseRecommendation(userId: number): Promise<{
    totalAmount: number;
    categoryAmounts: Record<string, number>;
    message: string;
  }> {
    const monthlyBudget = await this.budgetLib.getMonthlyBudget(userId); //설정한 이번달 총 예산
    console.log('monthlyBudget:', monthlyBudget);

    const previousExpenses = await this.expenseLib.getPreviousExpense(userId); //이번달 동안 사용한 총 지출 계산
    console.log('previousExpenses:', previousExpenses);
    const minAmount = 1000; // 최소 금액 설정

    // 이후 일자 동안의 예산 계산
    const remainingDays = this.getRemainingDaysInMonth();
    console.log('remainingDays:', remainingDays);
    const dailyBudget = Math.max(
      minAmount,
      (monthlyBudget - previousExpenses) / remainingDays,
    );
    console.log('dailyBudget:', dailyBudget);

    // 오늘 예산 계산
    const todayBudget = Math.max(minAmount, dailyBudget);
    console.log('todayBudget:', todayBudget);

    const categoryBudgets: Record<string, number> = {};
    const categories = Object.keys(previousExpenses);

    // 각 카테고리에 할당할 금액 계산
    categories.forEach((category) => {
      const categoryBudget = monthlyBudget / categories.length;
      categoryBudgets[category] = Math.max(minAmount, categoryBudget);
    });

    console.log('categoryBudgets:', categoryBudgets);

    // 금액을 사용자 친화적으로 변환
    const roundedTodayBudget = Math.round(todayBudget / 100) * 100;

    // 사용자 상황에 맞는 멘트 생성
    let message;
    if (roundedTodayBudget < 5000) {
      message =
        '오늘은 예산을 좀 더 신중하게 다뤄봐요. 금액을 다시 확인해보세요.';
    } else if (roundedTodayBudget >= 5000 && roundedTodayBudget < 20000) {
      message =
        '오늘은 적은 예산으로도 절약할 수 있어요. 지출을 신중하게 해보세요.';
    } else {
      message = '적당한 금액으로 지출하고 계시네요. 잘하고 있어요!';
    }

    return {
      totalAmount: roundedTodayBudget,
      categoryAmounts: categoryBudgets,
      message: message,
    };
  }

  async getTodaysExpenseGuide(userId: number) {
    return true;
  }

  @Cron('0 9 * * 1')
  async getAverageBudgetStatistics(): Promise<void> {
    const averageBudget = await this.statisticsLib.getAverageBudgetStatistics();

    await this.cacheManager.set('averageBudget', JSON.stringify(averageBudget));
  }

  /* 이번달에 남은 기간 계산 */
  getRemainingDaysInMonth(): number {
    const today = new Date();
    const lastDayOfMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
    );
    return lastDayOfMonth.getDate() - today.getDate() + 1;
  }
}
