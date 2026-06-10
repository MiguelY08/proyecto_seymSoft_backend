/**
 * UseCase: CreateInstallmentUseCase
 * Responsibility: Apply business rules to create a new installment.
 */
import PaymentsRepository from "../repositories/PaymentsRepository.js";
import InstallmentMapper from "../mappers/InstallmentMapper.js";

export default class CreateInstallmentUseCase {
  constructor({
    repository = new PaymentsRepository(),
    mapper = InstallmentMapper,
  } = {}) {
    this.repository = repository;
    this.mapper = mapper;
  }

  async execute(payload = {}) {
    // Business logic to create installment will go here
    return this.mapper.toDto(payload);
  }
}
