import React from "react";

// 定义接口，不能实例化
export interface InputFormProps {
    label: string,
    placeholder: string,
    value?: string,  // 带?的为可选属性（Optional Property）,不带的为必填属性
    type?: string,
    large?: boolean,
    onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

export default function InputForm({ label, placeholder, value, type, large, onChange }: InputFormProps ) {  // TypeScript 中的参数解构配合类型注解，这部分是 ES6 的对象解构语法，从传入的 props 对象中提取这些属性，确定解构的参数应该符合 InputFormProps 接口的定义。
    return (
        <div className="flex flex-col gap-1.5">

            <label className="text-zinc-600 font-medium text-sm">{label}</label>

            {large?(
                <textarea
                    className={`bg-white py-2 px-3 border border-zinc-300 placeholder:text-zinc-500 text-zinc-900 shadow-xs rounded-lg focus:ring-[4px] focus:ring-zinc-400/15 focus:outline-none h-24 align-text-top`}
                    placeholder={placeholder}
                    value={value || ''}
                    onChange={onChange}
                />
            ):(
                <input
                    className={`bg-white py-2 px-3 border border-zinc-300 placeholder:text-zinc-500 text-zinc-900 shadow-xs rounded-lg focus:ring-[4px] focus:ring-zinc-400/15 focus:outline-none`}
                    type={type}
                    placeholder={placeholder}
                    value={value || ''}
                    onChange={onChange}
                />
            )}
        </div>
    )
}