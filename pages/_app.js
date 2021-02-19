import Head from 'next/head'
import '../styles/globals.css'

function MyApp({ Component, pageProps }) {
  return <>
    <Head>
      <script
          src="https://apis.google.com/js/platform.js?onload=init"
          async
          defer
        ></script>
    </Head>
    <Component {...pageProps} />
  </>
}

export default MyApp
