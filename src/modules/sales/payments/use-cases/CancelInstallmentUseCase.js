/**
 * UseCase: CancelInstallmentUseCase
 * Responsibility: Apply business rules to cancel an installment.
 */
import PaymentsRepository from "../repositories/PaymentsRepository.js";
import InstallmentMapper from "../mappers/InstallmentMapper.js";

export default class CancelInstallmentUseCase {
  constructor({
    repository = new PaymentsRepository(),
    mapper = InstallmentMapper,
  } = {}) {
    this.repository = repository;
    this.mapper = mapper;
  }

  async execute({ params, body } = {}) {
    // Business logic to cancel installment will go here
    return this.mapper.toDto({ params, body });
  }
}
