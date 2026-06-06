/**
 * UseCase: GetCreditCustomersUseCase
 * Responsibility: Implement business rules to retrieve credit customers.
 */
import PaymentsRepository from "../repositories/PaymentsRepository.js";
import PaymentMapper from "../mappers/PaymentMapper.js";

export default class GetCreditCustomersUseCase {
  constructor({
    repository = new PaymentsRepository(),
    mapper = PaymentMapper,
  } = {}) {
    this.repository = repository;
    this.mapper = mapper;
  }

  async execute(params = {}) {
    const raw = await this.repository.findCreditCustomers(params);
    return raw.map((r) => this.mapper.toDto(r));
  }
}
