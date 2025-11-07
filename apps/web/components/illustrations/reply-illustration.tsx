import { AtSign, Paperclip, Smile } from 'lucide-react'

export const ReplyIllustration = () => {
    return (
        <div className="relative z-10 mx-auto">
            <div className="bg-linear-to-b blur-xs pointer-events-none absolute bottom-6 left-0 top-0 w-2 rounded-2xl from-transparent via-white to-teal-500 opacity-75"></div>
            <div className="ring-foreground/10 bg-background/75 rounded-b-[20px] border border-transparent p-2 text-xs shadow-2xl shadow-black/55 ring-1 backdrop-blur">
                <div className="bg-foreground/5 ring-foreground/10 space-y-3 rounded-xl px-4 pb-2 pt-4 ring-1">
                    <p className="text-sm font-medium text-indigo-400">
                        @Bernard <span className="text-muted-foreground font-normal">Shared 2 invoices</span>
                    </p>

                    <div className="text-muted-foreground *:hover:text-foreground -ml-1.5 flex">
                        <div className="hover:text-foreground hover:bg-foreground/5 text-foreground/65 hover:border-foreground/5 flex size-8 rounded-full border border-transparent">
                            <AtSign className="m-auto size-4" />
                        </div>
                        <div className="hover:text-foreground hover:bg-foreground/5 text-foreground/65 hover:border-foreground/5 flex size-8 rounded-full border border-transparent">
                            <Smile className="m-auto size-4" />
                        </div>
                        <div className="hover:text-foreground hover:bg-foreground/5 text-foreground/65 hover:border-foreground/5 flex size-8 rounded-full border border-transparent">
                            <Paperclip className="m-auto size-4" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}