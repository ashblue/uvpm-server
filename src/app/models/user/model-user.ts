import { ModelBase } from './../base/model-base';

import mongoose = require('mongoose');
import { RoleType } from '../../controllers/user-roles/roles/e-role-type';

export class ModelUserSchema extends ModelBase {
  public static ROLE_ADMIN = 'admin';
  public static ROLE_SUBSCRIBER = 'subscriber';
  public static ROLE_AUTHOR = 'author';
  public static ROLE_GUEST = 'guest';

  protected get schemaDefinition (): mongoose.SchemaDefinition {
    return {
      name: {
        type: String,
        required: [true, 'Name is required'],
      },
      email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        validate: [
          {
            message: 'Please provide a valid email',
            validator: (email) => {
              return new Promise((resolve, reject) => {
                const regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                resolve(regex.test(email));
              });
            },
          },
        ],
      },
      password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        validate: [
          {
            message: 'Must have at least one letter',
            validator: (password) => {
              return new Promise((resolve, reject) => {
                const regex = /[a-z]/i;
                resolve(regex.test(password));
              });
            },
          },
          {
            message: 'Must have at least one number',
            validator: (password) => {
              return new Promise((resolve, reject) => {
                const regex = /\d+/g;
                resolve(regex.test(password));
              });
            },
          },
        ],
      },
      role: {
        type: String,
        set: this.setRole.bind(this),
        get: this.getRole.bind(this),
      },
    };
  }

  public static stringToRole (role: string): RoleType {
    switch (role) {
      case ModelUserSchema.ROLE_ADMIN:
        return RoleType.Admin;
      case ModelUserSchema.ROLE_AUTHOR:
        return RoleType.Author;
    }

    return RoleType.Subscriber;
  }

  protected transform (doc, ret) {
    delete ret.password;

    return super.transform(doc, ret);
  }

  private getRole (roleString: string): RoleType {
    return ModelUserSchema.stringToRole(roleString);
  }

  private setRole (roleString: string): string {
    const role = ModelUserSchema.stringToRole(roleString);

    return this.roleToString(role);
  }

  private roleToString (role: RoleType): string {
    switch (role) {
      case RoleType.Admin:
        return ModelUserSchema.ROLE_ADMIN;
      case RoleType.Author:
        return ModelUserSchema.ROLE_AUTHOR;
    }

    return ModelUserSchema.ROLE_SUBSCRIBER;
  }
}
