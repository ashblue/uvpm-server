export interface IUserPermissions {
  // Ability to register a new user
  createUser: boolean;

  // Create a new package
  createPackage: boolean;

  // Retrieve a package
  getPackage: boolean;

  // Delete a package this user created
  deleteOwnPackages: boolean;

  // Delete a package this user did not create
  deleteOtherPackages: boolean;

  // Search for a package
  searchPackages: boolean;
}
