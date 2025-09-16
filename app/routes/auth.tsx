import {usePuterStore} from "~/lib/puter";
import {useEffect} from "react";
import {useLocation, useNavigate} from "react-router";
import Particles from "../components/Particles";

export const meta = () => ([
    { title: 'HireLens | Auth' },
    { name: 'description', content: 'Log into your account' },
])

const Auth = () => {
    const { isLoading, auth } = usePuterStore();
    const location = useLocation();
    const next = location.search.split('next=')[1]; //next page which can either be a login or proper page.
    const navigate = useNavigate();

    useEffect(() => {
        if(auth.isAuthenticated) navigate(next); //if a user tries to access a secured route without authenticated,
        // they will be blocked here.
    }, [auth.isAuthenticated, next])

    return (
        <main className="min-h-screen flex items-center justify-center">
            <div className="absolute inset-0 z-0">
                <Particles
                    particleColors={["#00ff00", "#00008b", "#ff0000"]}
                    particleCount={200}
                    particleSpread={12}
                    speed={0.2}
                    particleBaseSize={130}
                    moveParticlesOnHover={true}
                    alphaParticles={false}
                    disableRotation={false}
                    className="w-full h-full"
                />
            </div>
            <div className="gradient-border relative shadow-lg z-10">
                <section className="flex flex-col gap-8 bg-white rounded-2xl p-10">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <h1>Welcome</h1>
                        <h2>Log In to Continue</h2>
                    </div>
                    <div>
                        {isLoading ? (
                            <button className="auth-button animate-pulse">
                                <p>Signing you in...</p>
                            </button>
                        ) : (
                            <>
                                {auth.isAuthenticated ? (
                                    <button className="auth-button" onClick={auth.signOut}>
                                        <p>Log Out</p>
                                    </button>
                                ) : (
                                    <button className="auth-button" onClick={auth.signIn}>
                                        <p>Log In</p>
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </section>
            </div>
        </main>
    )
}

export default Auth