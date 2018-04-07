export interface IUserPermissions {
  // Ability to register a new user
  createUser: boolean;

  // Create a new package
  createPackage: boolean;

  // Retrieve a package
  getPackage: boolean;

  // Delete a package
  deletePackage: boolean;

  // Search for a package
  searchPackages: boolean;
}
