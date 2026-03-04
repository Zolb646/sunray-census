import type { LocalizationResource } from '@clerk/types'

export const clerkLocalization: LocalizationResource = {
  locale: 'mn-MN',
  socialButtonsBlockButton: '{{provider}}-ээр үргэлжлүүлэх',
  socialButtonsBlockButtonManyInView:
    '{{provider|titleize}}-ээр үргэлжлүүлэх',
  dividerText: 'эсвэл',
  formFieldLabel__emailAddress: 'И-мэйл хаяг',
  formFieldLabel__emailAddress_username: 'И-мэйл эсвэл хэрэглэгчийн нэр',
  formFieldLabel__username: 'Хэрэглэгчийн нэр',
  formFieldLabel__password: 'Нууц үг',
  formFieldInputPlaceholder__emailAddress: 'И-мэйл хаягаа оруулна уу',
  formFieldInputPlaceholder__emailAddress_username:
    'И-мэйл эсвэл хэрэглэгчийн нэрээ оруулна уу',
  formFieldInputPlaceholder__username:
    'Хэрэглэгчийн нэрээ оруулна уу',
  formFieldInputPlaceholder__password: 'Нууц үгээ оруулна уу',
  formFieldAction__forgotPassword: 'Нууц үгээ мартсан уу?',
  formButtonPrimary: 'Үргэлжлүүлэх',
  formButtonPrimary__verify: 'Баталгаажуулах',
  signInEnterPasswordTitle: 'Нууц үгээ оруулна уу',
  backButton: 'Буцах',
  footerActionLink__useAnotherMethod: 'Өөр аргаар үргэлжлүүлэх',
  signIn: {
    start: {
      title: 'Нэвтрэх',
      titleCombined: 'Нэвтрэх',
      subtitle:
        'Sunray удирдлагын самбарт үргэлжлүүлэхийн тулд нэвтэрнэ үү',
      subtitleCombined:
        'Sunray удирдлагын самбарт үргэлжлүүлэхийн тулд нэвтэрнэ үү',
      actionText: 'Бүртгэлгүй юу?',
      actionLink: 'Бүртгүүлэх',
      actionLink__use_email: 'И-мэйлээр нэвтрэх',
      actionLink__use_phone: 'Утсаар нэвтрэх',
      actionLink__use_username: 'Хэрэглэгчийн нэрээр нэвтрэх',
      actionLink__use_email_username: 'И-мэйлээр нэвтрэх',
      actionLink__use_passkey: 'Passkey ашиглах',
    },
    password: {
      title: 'Нууц үгээр нэвтрэх',
      subtitle:
        'Бүртгэлдээ үргэлжлүүлэхийн тулд нууц үгээ оруулна уу',
      actionLink: 'Өөр аргаар нэвтрэх',
    },
    passkey: {
      title: 'Passkey ашиглан нэвтрэх',
      subtitle: 'Passkey-гээ ашиглан үргэлжлүүлнэ үү',
    },
    forgotPassword: {
      title: 'Нууц үг сэргээх',
      subtitle:
        'Нууц үгээ шинэчлэхийн тулд алхмуудыг дагана уу',
      subtitle_email:
        'Нууц үг сэргээх код хүлээн авахын тулд и-мэйл хаягаа ашиглана уу',
      formTitle: 'Баталгаажуулах код',
      resendButton: 'Код дахин илгээх',
    },
    resetPassword: {
      title: 'Нууц үгээ шинэчлэх',
      formButtonPrimary: 'Нууц үг шинэчлэх',
      successMessage: 'Нууц үг амжилттай шинэчлэгдлээ',
      requiredMessage: 'Нууц үг шаардлагатай',
    },
    emailCode: {
      title: 'Кодоор нэвтрэх',
      subtitle: 'И-мэйл рүү илгээсэн кодоо оруулна уу',
      formTitle: 'Баталгаажуулах код',
      resendButton: 'Код дахин илгээх',
    },
  },
}
