import { ProfileSummaryDto } from "../dtos/profileSummaryDto.js";

export class ProfileSummaryMapper {
  static toDto({
    user,
    financialSummary,
    creditStatus,
  }) {
    return new ProfileSummaryDto({
      user,
      financialSummary,
      creditStatus,
    });
  }
}
