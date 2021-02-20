import { loginOrCreateUser } from '../utils/auth'

export default function Login() {
  return (
    <div className="flex items-center justify-center h-screen" style={{backgroundColor: '#404040', opacity: 0.9}}>
      <div className="rounded p-10 bg-white" style={{width: '600px'}}>
        <p className="text pb-4">
          Newsletter Reader is going to request a number of persmissions.<br />Here are a few thing to know:
        </p>
        <div className="pb-4" style={{fontSize: '14px'}}>
          <p className="font-bold">
            Connects with your Gmail
          </p>
          <p className="text">
            The Newsletter Reader integrates with your Gmail so there’s no need for a new email address or subscribing to all the newsletters again.
          </p>
        </div>
        <div className="pb-4" style={{fontSize: '14px'}}>
          <p className="font-bold">
            Your data is safe
          </p>
          <p className="text">
            We’re are here to help you better consume your newsletters, nothing else. Your emails stay 100% private and secure. Our use of information adheres to
            {' '}
            <a
              className="underline"
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
            >
              Google API Services User Data Policy
            </a>.
          </p>
        </div>
        <div className="pb-24" style={{fontSize: '14px'}}>
          <p className="font-bold">
            Easy to go back
          </p>
          <p className="text">
            If you decide the Newsletter Reader is not or you, you can simply deactivate and delete your account and your inbox will look as before. 
          </p>
        </div>
        <div className="w-full text-center">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={async () => {
              await loginOrCreateUser();
            }}
          >
            Continue signing in
          </button>
        </div>
      </div>
    </div>
  );
}
