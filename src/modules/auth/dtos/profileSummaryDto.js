export class ProfileSummaryDto {
  constructor({
    user,
    financialSummary,
    creditStatus,
  }) {
    this.user = user;
    this.financialSummary = financialSummary;
    this.creditStatus = creditStatus;
  }
}
