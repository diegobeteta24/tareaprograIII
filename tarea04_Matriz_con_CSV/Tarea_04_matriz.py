import csv
import graphviz as gv


def cargar_desde_csv(archivo_csv):
    datos_csv = []
    try:
        with open(archivo_csv, 'r') as f:
            lector = csv.reader(f)
            for r in lector:
                fila_csv = []
                for i in r:
                    try:
                        num = int(i)
                        fila_csv.append(str(num))
                    except ValueError:
                        pass
                if fila_csv:
                    datos_csv.append(fila_csv)
        return datos_csv
    except FileNotFoundError:
        print("")
        print("El archivo especificado no existe.")
        print("")
        return []
    except Exception as e:
        print("")
        print("Ocurrió un error al cargar el archivo CSV:", e)
        print("")
        return []


def ingresar_manualmente(datos_ingresados):
    print("")
    print("Ingrese los datos, al ingresar cada dato de Enter. Si no desea ingresar más datos, simplemente deje en blanco.")
    print("Y precione ENETER para continuar")
    print("")
    while True:
        entrada_usuario = input("Ingrese una línea de datos: ")
        if entrada_usuario:
            datos_ingresados.append(entrada_usuario.split(','))
        else:
            break


def visualizar_datos(datos_visuales):
    if not datos_visuales:
        print("")
        print("No hay datos para mostrar.")
        print("")
    else:
        print("")
        print("Datos:")
        print("")
        for fila_v in datos_visuales:
            print(fila_v)


def generar_grafico_matriz(datos_matriz):
    if not datos_matriz:
        print("")
        print("No hay datos para generar el gráfico.")
        print("")
        return

    try:
        dot = gv.Digraph()
        num_filas = len(datos_matriz)
        num_columnas = len(datos_matriz[0])

        for fila_m in range(num_filas):
            for columna_m in range(num_columnas):
                valor_m = datos_matriz[fila_m][columna_m]
                if valor_m.strip() != "":
                    dot.node(f"{fila_m}-{columna_m}", valor_m)
                    if fila_m > 0:
                        dot.edge(f"{fila_m - 1}-{columna_m}", f"{fila_m}-{columna_m}")
                    if columna_m > 0:
                        dot.edge(f"{fila_m}-{columna_m - 1}", f"{fila_m}-{columna_m}")

        dot.render('matriz_dispersa', format='jpg', cleanup=True)
        print("")
        print("Se ha generado el gráfico de la matriz dispersa.")
        print("La gráfica se guarda en la ruta del proyecto")
        print("")
    except Exception as e:
        print("")
    if "list index out of range" in str(e):
        print("")
        print("Error: No se puede generar el gráfico de la matriz dispersa debido a que la matriz tiene un tamaño incorrecto.")
    else:
        print("")
        print("Ocurrió un error al generar el gráfico de la matriz dispersa:", e)
    print("")


def main():
    print("")
    print("Creador de matriz dispersa con CSV")
    print("")
    datos_principales = []
    while True:
        print("")
        print("______________________MENU________________________")
        print("")
        print("\nEscoja una de las opciones:")
        print("1. Cargar desde un archivo CSV")
        print("2. Agregar datos manualmente")
        print("3. Visualizar datos")
        print("4. Generar gráfico de matriz dispersa")
        print("5. Salir")
        print("")

        opcion = input("Seleccione una opción: ")

        if opcion == '1':
            print("")
            archivo_csv = input("Por favor, ingresa la dirección del archivo CSV (sin comillas): ")
            nuevos_datos = cargar_desde_csv(archivo_csv)
            datos_principales.extend(nuevos_datos)
        elif opcion == '2':
            ingresar_manualmente(datos_principales)
        elif opcion == '3':
            visualizar_datos(datos_principales)
        elif opcion == '4':
            generar_grafico_matriz(datos_principales)
        elif opcion == '5':
            print("¡Hasta luego!")
            break
        else:
            print("___________________________________________________________________________________")
            print("Opción no válida. Por favor, seleccione una opción válida.")
            


if __name__ == "__main__":
    main()
