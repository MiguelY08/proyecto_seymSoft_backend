/**
 * UseCase: GetCustomerContactUseCase
 * Responsibility: Retrieve customer contact information according to business rules.
 */
import PaymentsRepository from "../repositories/PaymentsRepository.js";
import ContactMapper from "../mappers/ContactMapper.js";

export default class GetCustomerContactUseCase {
  constructor({
    repository = new PaymentsRepository(),
    mapper = ContactMapper,
  } = {}) {
    this.repository = repository;
    this.mapper = mapper;
  }

  async execute({ params } = {}) {
    const raw = null;
    return this.mapper.toDto(raw);
  }
}
