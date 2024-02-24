def convertir_a_binario(num):
    if num > 1:
        convertir_a_binario(num // 2)
    print(num % 2, end='')


def contar_digitos(num):
    if num == 0:
        return 0
    return 1 + contar_digitos(num // 10)


def raiz_cuadrada_entera(num):
    def calcular_raiz_cuadrada(x, low, high):
        mitad = (low + high) // 2
        if mitad * mitad <= x < (mitad + 1) * (mitad + 1):
            return mitad
        elif mitad * mitad > x:
            return calcular_raiz_cuadrada(x, low, mitad - 1)
        else:
            return calcular_raiz_cuadrada(x, mitad + 1, high)

    return calcular_raiz_cuadrada(num, 0, num)


def convertir_a_decimal(romano):
    romano_valores = {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000}
    decimal = 0
    prev_val = 0
    for letra in romano[::-1]:
        val = romano_valores[letra]
        if val < prev_val:
            decimal -= val
        else:
            decimal += val
        prev_val = val
    return decimal


def suma_numeros_enteros(n):
    if n == 0:
        return 0
    return n + suma_numeros_enteros(n - 1)


def menu():
    while True:
        print("\nBienvenido al menu de RECURSIVIDAD, escoja un metodo por favot:")
        print("1. Convertir un número a binario")
        print("2. Contar dígitos de un número")
        print("3. Calcular raíz cuadrada entera")
        print("4. Convertir número romano a decimal")
        print("5. Sumar números enteros hasta un valor")
        print("6. Salir")
        opcion = input("Ingrese el número de la opción que desea ejecutar: ")


        if opcion == '1':
            numero = int(input("Ingrese un número entero para volverlo binario: "))
            print("El número", numero, "en binario es:")
            convertir_a_binario(numero)
            print()
            input("Presione Enter para volver al menú...")
        elif opcion == '2':
            numero = int(input("Ingrese un número entero para contar sus digitos: "))
            print("El número", numero, "tiene", contar_digitos(numero), "dígitos.")
            input("Presione Enter para volver al menú...")
        elif opcion == '3':
            numero = int(input("Ingrese un número entero para sacar su raiz: "))
            print("La raíz cuadrada entera de", numero, "es:", raiz_cuadrada_entera(numero))
            input("Presione Enter para volver al menú...")

        elif opcion == '4':
            numero_romano = input("Ingrese un número romano: ")
            print("El número romano", numero_romano, "equivale a", convertir_a_decimal(numero_romano), "en decimal.")
        elif opcion == '5':
            numero = int(input("Ingrese un número entero: "))
            print("La suma de todos los números enteros desde 0 hasta", numero, "es:", suma_numeros_enteros(numero))
            input("Presione Enter para volver al menú...")
        elif opcion == '6':
            print("¡Adiós!")
            break
        else:
            print("Opción no válida, intente de nuevo por favor.")



menu()
