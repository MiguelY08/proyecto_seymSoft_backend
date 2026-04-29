export class UpdateProfileDto {
  constructor({ phone, address, currentPassword, newPassword }) {
    this.phone = phone;
    this.address = address;
    this.currentPassword = currentPassword;
    this.newPassword = newPassword;
  }
}
