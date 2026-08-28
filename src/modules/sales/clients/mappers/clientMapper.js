export class ClientMapper {
  static #serializeBigInt(value) {
    if (value === null || value === undefined) return null;
    return typeof value === 'bigint' ? Number(value) : value;
  }

  static toDTO(dbClient) {
    if (!dbClient) return null;
    
    const user = dbClient.users;
    const fullName = user?.full_name || '';
    const isLegalPerson = dbClient.person_type === 'juridica';
    const businessName = fullName
      .replace(/\s+(Empresa|N\/A)$/i, '')
      .trim();
    
    return {
      id: dbClient.id_client,
      personType: dbClient.person_type,
      documentType: dbClient.doc_type,
      document: ClientMapper.#serializeBigInt(dbClient.doc_number),  // ✅ usa ClientMapper
      firstName: isLegalPerson
        ? businessName
        : fullName.split(' ')[0] || '',
      lastName: isLegalPerson
        ? ''
        : fullName.split(' ').slice(1).join(' '),
      fullName,
      email: user?.email || '',
      phone: user?.phone ? String(user.phone) : '',
      address: dbClient.address || '',
      contactName: dbClient.contact_person_name || '',
      contactPhone: dbClient.contact_person_number ? String(dbClient.contact_person_number) : '',
      clientType: dbClient.client_type || '',
      clientCredit: dbClient.credit ? String(dbClient.credit) : '0',
      credit_balance: dbClient.credit_balance ? String(dbClient.credit_balance) : '0',
      favorBalance: Number(dbClient.credit_balance ?? 0),
      rut: dbClient.rut ? 'si' : 'no',
      ciuCode: dbClient.codigo_ciu || '',
      active: user?.id_status === 1,
      idStatus: user?.id_status || 1,
      idUser: dbClient.id_user,
      clientSince: user?.creation_date ? new Date(user.creation_date).toISOString().split('T')[0] : '',
      createdAt: user?.creation_date ? new Date(user.creation_date).toISOString() : null
    };
  }
}
