export class ProviderMapper {
  // Función auxiliar para convertir BigInt a Number
  static #serializeBigInt(value) {
    if (value === null || value === undefined) return null;
    return typeof value === 'bigint' ? Number(value) : value;
  }

  static toDTO(dbProvider) {
    if (!dbProvider) return null;
    
    // Extraer categorías de la relación
    const categories = dbProvider.provider_categories?.map(pc => ({
      id: pc.categories?.id_category,
      name: pc.categories?.category_name
    })) || [];
    
    const isLegalPerson = dbProvider.person_type === 'juridica';
    const lastname = String(dbProvider.lastname || '').trim();
    const displayLastname = isLegalPerson && lastname.toLowerCase() === 'empresa'
      ? ''
      : lastname;
    const fullName = isLegalPerson
      ? String(dbProvider.name_provider || '').trim()
      : `${dbProvider.name_provider || ''} ${displayLastname}`.trim();

    return {
      id: dbProvider.id_provider,
      personType: dbProvider.person_type,
      documentType: dbProvider.document_type,
      documentNumber: dbProvider.document_number,
      nameProvider: dbProvider.name_provider,
      lastname: displayLastname,
      fullName,
      email: dbProvider.email,
      phone: dbProvider.phone,
      address: dbProvider.address,
      contactPersonName: dbProvider.contact_person_name,
      contactPersonNumber: this.#serializeBigInt(dbProvider.contact_person_number),
      rut: dbProvider.rut,
      ciuCode: dbProvider.ciu_code,
      maxReturnPeriod: dbProvider.max_return_period,
      active: dbProvider.id_status === 1,
      idStatus: dbProvider.id_status,
      createdAt: dbProvider.created_at,
      updatedAt: dbProvider.updated_at,
      categories: categories
    };
  }

  static toCreateDB(dto) {
    return {
      person_type: dto.personType,
      document_type: dto.documentType,
      document_number: dto.documentNumber,
      name_provider: dto.nameProvider,
      lastname: dto.personType === 'juridica' ? null : dto.lastname,
      email: dto.email,
      phone: dto.phone,
      address: dto.address,
      contact_person_name: dto.contactPersonName,
      contact_person_number: dto.contactPersonNumber ? BigInt(dto.contactPersonNumber) : null,
      rut: dto.rut,
      ciu_code: dto.ciuCode,
      max_return_period: dto.maxReturnPeriod,
      id_status: dto.idStatus
    };
  }

  static toUpdateDB(updateData) {
    const dbData = {};
    if (updateData.personType !== undefined) dbData.person_type = updateData.personType;
    if (updateData.email !== undefined) dbData.email = updateData.email;
    if (updateData.phone !== undefined) dbData.phone = updateData.phone;
    if (updateData.address !== undefined) dbData.address = updateData.address;
    if (updateData.contactPersonName !== undefined) dbData.contact_person_name = updateData.contactPersonName;
    if (updateData.contactPersonNumber !== undefined) dbData.contact_person_number = updateData.contactPersonNumber ? BigInt(updateData.contactPersonNumber) : null;
    if (updateData.rut !== undefined) dbData.rut = updateData.rut;
    if (updateData.ciuCode !== undefined) dbData.ciu_code = updateData.ciuCode;
    if (updateData.maxReturnPeriod !== undefined) dbData.max_return_period = updateData.maxReturnPeriod;
    if (updateData.idStatus !== undefined) dbData.id_status = updateData.idStatus;
    return dbData;
  }
}
