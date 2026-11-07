import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import loginLeft from "../assets/loginLeft.png";
import logo from "../assets/logo.png";
import { login } from "../services/authService.js";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            await login({ username, password });
            toast.success("Đăng nhập thành công!");
            navigate(location.state?.from?.pathname || "/", { replace: true });
        } catch (requestError) {
            const message = requestError.response?.data?.message || requestError.message || "Đăng nhập thất bại.";
            setError(message);
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="flex min-h-screen flex-col bg-white font-sans text-slate-900 min-[600px]:flex-row">
            <section className="relative flex min-h-[650px] w-full flex-col overflow-hidden bg-[#6554D9] px-7 py-6 text-white min-[600px]:h-screen min-[600px]:min-h-0 min-[600px]:w-[55%] min-[600px]:min-w-0 min-[600px]:px-4 min-[600px]:py-4 md:w-[65%] md:px-8 md:py-6 xl:px-16">
                <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full border-[78px] border-white/[0.07]" />
                <div className="pointer-events-none absolute -bottom-56 -left-40 h-[480px] w-[480px] rounded-full border-[70px] border-white/[0.06]" />

                <header className="relative z-10 flex items-center gap-3">
                    <img src={logo} alt="" className="h-12 w-[72px] object-contain" />
                    <div>
                        <p className="text-2xl font-extrabold tracking-tight">TrọEasy</p>
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/65">
                            Property workspace
                        </p>
                    </div>
                </header>

                <div className="relative z-10 mx-auto mt-4 flex w-full max-w-[1380px] flex-1 flex-col min-[600px]:mt-2 min-[600px]:min-h-0 xl:mt-3">
                    <div className="w-full max-w-[900px] py-2 min-[600px]:py-0">
                        <h1 className="text-2xl font-extrabold leading-[1.08] tracking-tight sm:text-3xl 2xl:text-[38px]">
                            Quản lý khu trọ, <span className="text-[#d9d1ff]">nhẹ nhàng hơn.</span>
                        </h1>
                        <p className="mt-3 max-w-md text-sm leading-5 text-white/80 sm:text-[15px]">
                            Phòng, khách thuê và doanh thu — gọn trong một nơi.
                        </p>
                    </div>

                    <div className="relative flex min-h-[360px] w-full flex-1 items-center justify-center min-[600px]:min-h-0">
                        <img
                            src={loginLeft}
                            alt="Minh họa quản lý khu trọ TroEasy"
                            className="max-h-[calc(100vh-260px)] w-full max-w-[1200px] object-contain"
                        />
                    </div>
                </div>
            </section>

            <section className="flex min-h-[560px] w-full items-center justify-center px-6 py-10 min-[600px]:h-screen min-[600px]:min-h-0 min-[600px]:w-[45%] min-[600px]:min-w-0 min-[600px]:px-4 min-[600px]:py-4 md:w-[35%] md:px-5 lg:px-8 xl:px-12 2xl:px-16">
                <div className="w-full max-w-[420px]">
                    <div className="mb-9">
                        <span className="mb-4 inline-flex rounded-full bg-[#efedff] px-3 py-1.5 text-xs font-bold text-[#6554D9]">
                            Chào mừng trở lại
                        </span>
                        <h2 className="text-3xl font-extrabold tracking-tight sm:text-[36px]">Đăng nhập</h2>
                    
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="username" className="mb-2 block text-[13px] font-bold text-slate-700">
                                Tên đăng nhập
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                autoComplete="username"
                                required
                                value={username}
                                onChange={(event) => setUsername(event.target.value)}
                                placeholder="Nhập tên đăng nhập"
                                className="h-[52px] w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#6554D9] focus:ring-4 focus:ring-violet-100"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="mb-2 block text-[13px] font-bold text-slate-700">
                                Mật khẩu
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder="Nhập mật khẩu"
                                className="h-[52px] w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#6554D9] focus:ring-4 focus:ring-violet-100"
                            />
                        </div>

                        {error && (
                            <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex h-[52px] w-full items-center justify-center rounded-xl bg-[#6554D9] px-4 text-sm font-bold text-white shadow-lg shadow-[#6554D9]/20 transition hover:bg-[#5544c6] focus-visible:outline focus-visible:outline-4 focus-visible:outline-violet-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
                        </button>
                    </form>

                </div>
            </section>
        </main>
    );
}
