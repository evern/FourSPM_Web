interface DefaultUser {
  email: string;
  avatarUrl: string;
}

const defaultUser: DefaultUser = {
  email: 'sandra@example.com',
  avatarUrl: 'https://js.devexpress.com/Demos/WidgetsGallery/JSDemos/images/employees/06.png'
};

export default defaultUser;
export type { DefaultUser };
