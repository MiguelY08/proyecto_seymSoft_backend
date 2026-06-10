/**
 * UseCase: GetCustomerInvoicesUseCase
 * Responsibility: Retrieve invoices for a customer according to business rules.
 */
import PaymentsRepository from "../repositories/PaymentsRepository.js";
import InvoiceMapper from "../mappers/InvoiceMapper.js";

export default class GetCustomerInvoicesUseCase {
  constructor({
    repository = new PaymentsRepository(),
    mapper = InvoiceMapper,
  } = {}) {
    this.repository = repository;
    this.mapper = mapper;
  }

  async execute({ params, query } = {}) {
    const raw = [];
    return raw.map((r) => this.mapper.toDto(r));
  }
}
