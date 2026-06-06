/**
 * UseCase: GetInvoiceInstallmentsUseCase
 * Responsibility: Retrieve installments for a specific invoice.
 */
import PaymentsRepository from "../repositories/PaymentsRepository.js";
import InstallmentMapper from "../mappers/InstallmentMapper.js";

export default class GetInvoiceInstallmentsUseCase {
  constructor({
    repository = new PaymentsRepository(),
    mapper = InstallmentMapper,
  } = {}) {
    this.repository = repository;
    this.mapper = mapper;
  }

  async execute({ params } = {}) {
    const raw = [];
    return raw.map((r) => this.mapper.toDto(r));
  }
}
