import { Stack, Button } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { useRouter } from "next/router";
import React from "react";
import { InputField } from "../components/InputField";
import { Wrapper } from "../components/Wrapper";
import { useRegisterMutation } from "../generated/graphql";
import { toErrorMap } from "../utils/toErrorMap";

// TODO: replace with react-hook-form
const Register = () => {
    const router = useRouter();
    const [, register] = useRegisterMutation();
    return (
        <Wrapper>
            <Formik
                initialValues={{ username: "", password: "" }}
                onSubmit={async (values, { setErrors }) => {
                    const response = await register({
                        username: values.username,
                        password: values.password,
                    });
                    if (response.data?.register.errors) {
                        setErrors(toErrorMap(response.data.register.errors));
                    } else if (response.data?.register.user) {
                        router.push("/");
                    }
                }}
            >
                {({ isSubmitting }) => (
                    <Form>
                        <Stack>
                            <InputField name="username" placeholder="Username" label="Username" />

                            <InputField
                                name="password"
                                placeholder="Password"
                                label="Password"
                                type="password"
                            />

                            <Button type="submit" colorScheme="teal" isLoading={isSubmitting}>
                                Register
                            </Button>
                        </Stack>
                    </Form>
                )}
            </Formik>
        </Wrapper>
    );
};

export default Register;